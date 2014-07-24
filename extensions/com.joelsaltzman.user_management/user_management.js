
var CROSS_DOMAIN_HANDLER_URL = "http://127.0.0.1/cross_domain_handler.php";

function query (usersController)
{
	var xmlhttp = usersController.newRequest();
	xmlhttp.onreadystatechange= function(){ usersController.fetchUser(this.responseText);};
	xmlhttp.open("GET", usersController.URL+"/"+usersController.bucketName+ "/_user/", true);
	xmlhttp.send();
};
function indexOfItemInArray(value, array){
	for(var i=0; i<array.length; i++){
		if(array[i] == value){
			return i;
		}
	}
	return -1;
}
function displayError(msg)
{
	document.write(msg);
}
function appendHTMLToElement(str, element)
{
	var child = document.createElement('div');
	child.innerHTML = str;
	while (child.firstChild) {
	  element.appendChild(child.firstChild);
	}
}
function jsonArray(rawString)
{
	var cleanedStrings = [];
	var strings = rawString.split(",");
	for(var i=0; i<strings.length; ++i)
	{
		var str = strings[i].trim();
		str = str.replace('"', '');
		cleanedStrings[cleanedStrings.length] = '"'+str+'"';
	}
	return JSON.parse("["+cleanedStrings.join()+"]");
}

/* --- Dialog --- */
var UserManagementDetailsDialog = mkClass({
  initialize: function (initValues, isNew, options) {
    var self = this;

    this.isNew = isNew;
    this.initValues = initValues;

    initValues.toBeAllocatedForOtherBuckets = initValues.toBeAllocatedForOtherBuckets || 0;

    initValues.ramQuotaMB = BytestoMB(initValues.quota.rawRAM - initValues.toBeAllocatedForOtherBuckets);

    options = options || {};

    this.dialogID = options.id || 'user_management_dialog';

    this.refreshBuckets = options.refreshBuckets || $m(BucketsSection, 'refreshBuckets');

    this.formValidationCallback = options.formValidationCallback || function () {};

    this.getFormValues = options.getFormValues || AutoCompactionSection.serializeCompactionForm;

    this.onSuccess = options.onSuccess || function () {
      hideDialog(this.dialogID);
    };

    this.doCreateBucket = options.doCreateBucket || function (uri, form, callback) {
       var data = self.getFormValues(form);
       jsonPostWithErrors(uri, data, callback);
    }

    var dialog = this.dialog = $('#' + this.dialogID);

    // dialog.removeClass('editing').removeClass('creating');
    // dialog.addClass(isNew ? 'creating' : 'editing');
    // dialog.find('[name=name]').boolAttr('disabled', !isNew);
  },
  startForm: function () {
    var self = this,
        form = this.dialog.find('form');
		usersController.selectUser(null);
		usersController.fetchAllUsers();
  },
  startDialog: function () {
    var self = this,
        dialog = $($i(this.dialogID));

    self.startForm();
	$("#user_form .save_button").bind('click', function (e) {
	      e.preventDefault(); 
		  usersController.saveUser();
    });
	$("#user_form .delete_button").bind('click', function (e) {
      e.preventDefault();
      showDialog('user_remove_dialog', {
        closeOnEscape: false,
        onHide: function(jq) {
          $('#user_management_dialog').dialog('option', 'closeOnEscape', true);
        }
      });
    });
    dialog.find('> h1').hide();
    showDialog(dialog, {
      title: dialog.find('> h1 span.when-' +
              (dialog.hasClass('creating') ? 'creating' : 'editing'))
              .html(),
      onHide: function () {
        self.cleanup();
      }
    });
  },
  cleanup: function () {
	  $("#container").css("position", "");
    _.each(this.cleanups, function (c) {
      c();
    });
  },

  renderGauge: function (jq, total, thisBucket, otherBuckets) {
    var thisValue = thisBucket,
        formattedBucket = ViewHelpers.formatQuantity(thisBucket, null, null, ' ');

    if (_.isString(thisValue)) {
      formattedBucket = thisValue;
      thisValue = 0;
    }

    var options = {
      topAttrs: {'class': 'size-gauge for-ram'},
      topRight: ['Cluster quota', ViewHelpers.formatMemSize(total)],
      items: [
        {name: 'Other Buckets',
         value: otherBuckets,
         attrs: {style: 'background-color:#00BCE9'},
         tdAttrs: {style: 'color:#1878a2;'}},
        {name: 'This Bucket',
         value: thisValue,
         attrs: {style: 'background-color:#7EDB49'},
         tdAttrs: {style: 'color:#409f05;'}},
        {name: 'Free',
         value: total - otherBuckets - thisValue,
         attrs: {style: 'background-color:#E1E2E3'},
         tdAttrs: {style: 'color:#444245;'}}
      ],
      markers: []
    };

    if (options.items[2].value < 0) {
      options.items[1].value = total - otherBuckets;
      options.items[2] = {
        name: 'Overcommitted',
        value: otherBuckets + thisValue - total,
        attrs: {style: 'background-color: #F40015;'},
        tdAttrs: {style: 'color:#e43a1b;'}
      };
      options.markers.push({value: total,
                            attrs: {style: 'background-color:#444245;'}});
      options.markers.push({value: otherBuckets + thisValue,
                            attrs: {style: 'background-color:red;'}});
      options.topLeft = ['Total Allocated', ViewHelpers.formatMemSize(otherBuckets + thisValue)];
      options.topLeftAttrs = {style: 'color:#e43a1b;'};
    }

    jq.replaceWith(memorySizesGaugeHTML(options));
  },

  renderError: function (field, error) {
    var fieldClass = field.replace(/\[|\]/g, '-');
    this.dialog.find('.error-container.err-' + fieldClass).text(error || '')[error ? 'addClass' : 'removeClass']('active');
    this.dialog.find('[name="' + field + '"]')[error ? 'addClass' : 'removeClass']('invalid');
  },

  getFormData: function () {
    var form = this.dialog.find('form');
    return serializeForm(form, {});
  },

  // this updates our gauges and errors
  // we don't use it to set input values, 'cause for the later we need to do it once
  onValidationResult: function (result) {
    if (!result)
      return;

    var self = this,
        summaries = result.summaries || {},
        ramSummary = summaries.ramSummary,
        ramGauge = self.dialog.find(".size-gauge.for-ram"),
        memcachedSummaryJQ = self.dialog.find('.memcached-summary'),
        memcachedSummaryVisible = ramSummary && ramSummary.perNodeMegs,
        knownFields = ('name ramQuotaMB replicaNumber proxyPort databaseFragmentationThreshold[percentage] viewFragmentationThreshold[percentage] databaseFragmentationThreshold[size] viewFragmentationThreshold[size] allowedTimePeriod threadsNumber purgeInterval saslPassword').split(' '),
        errors = result.errors || {};

    _.each(('to from').split(' '), function (p1) {
      _.each(('Hour Minute').split(' '), function (p2) {
        knownFields.push('allowedTimePeriod[' + p1 + p2 + ']');
      });
    });

    if (ramSummary) {
      self.renderGauge(ramGauge,
                       ramSummary.total,
                       ramSummary.thisAlloc - self.initValues.toBeAllocatedForOtherBuckets,
                       ramSummary.otherBuckets + self.initValues.toBeAllocatedForOtherBuckets);
    }
    ramGauge.css('visibility', ramSummary ? 'visible' : 'hidden');

    if (memcachedSummaryVisible) {
      memcachedSummaryJQ.text('Total bucket size = '
                              + BytestoMB(ramSummary.thisAlloc - self.initValues.toBeAllocatedForOtherBuckets * ramSummary.nodesCount)
                              + ' MB ('
                              + (ramSummary.perNodeMegs - BytestoMB(self.initValues.toBeAllocatedForOtherBuckets)).toString()
                              + ' MB x ' + ViewHelpers.count(ramSummary.nodesCount, 'node') +')');
    }
    memcachedSummaryJQ.css('display', memcachedSummaryVisible ? 'block' : 'none');

    _.each(knownFields, function (name) {
      self.renderError(name, errors[name]);
    });
  }
});
function jsonCallback(item){
	// console.log("jsonCallback ");
	// console.log(item);
}

/* --- ADMIN INFO --- */
var UsersController = {
	URL: "",
	bucketName: "",
	userCount: 0,
	users: {},
	userKeys: [],
	selectedUser:{},
	getBucketName: function(uri){//"/pools/default/buckets/chat?bucket_uuid=..."
		  var pattern = "buckets/(.*)?\\?";
		  var regex = new RegExp( pattern );
		  var results = regex.exec( uri );
		  if(results != null){
			  return results[1];
		  }
		  return null;
	},
	newRequest: function()
	{
		if(window.XMLHttpRequest){
			return xmlhttp=new XMLHttpRequest();
		}
		else{
			xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
		}
	},
	fetchAllUsers: function(selectionRow){
		var usersController = this;
		var query = "/"+usersController.bucketName+"/_user/";
        $.ajax({
          url: CROSS_DOMAIN_HANDLER_URL+"?sync_gateway_query="+encodeURIComponent(query),
          dataType: 'jsonp',
		  contentType: "application/json",
  		  jsonpCallback: 'jsonCallback',
          success: function (userNames) { 
			  if(userNames == undefined){
				  return;
			  }
			usersController.userCount = userNames.length;
			usersController.users = [];
			for(i=0; i<userNames.length; ++i){
				usersController.users[userNames[i]] = {};
			}
			usersController.displayUsers();
			if(selectionRow != undefined){
				usersController.selectRow(selectionRow);
				var row = $("td:contains("+selectionRow+")")
				if(row.length){
					$('#users').scrollTop(row.position().top);
				}
				
			}
		  },
          error: function (jqXHR,error, errorThrown) {
			  usersController.handleError(jqXHR);
		  }
        });
	},
	
	displayUsers: function()
	{
		this.parseUserKeys();
		this.updateUserRows();
		this.toggleUserSettingsForm(false);
	},
	parseUserKeys: function()
	{
		//combine default keys with custom keys user has added
		var columns = ["name", "email", "password", "disabled", "admin_channels", "admin_roles", "all_channels", "roles"];
		for(var userName in this.users){
			var user = this.users[userName];
			for(var key in user){
				if(indexOfItemInArray(key, columns) == -1){
					columns.push(key);
				}
			}
		}
		this.userKeys = columns;
	},
	updateUserRows: function()
	{
		var tableBody = $("#usersTableBody");
		tableBody.html('');
		var userNames = [];
		for(var userName in this.users){
			userNames[userNames.length] = userName;
		}
		userNames.sort();
		for(var i=0; i<userNames.length; ++i){
			var userName = userNames[i];
			// html += "<tr class=\"user_row\"><td>"+userName+"</td></tr>";
			var tr = document.createElement('tr');
			tr.className = "user_row";
			tr.onclick =  function(e) {
				if(this.className.indexOf("ui-state-highlight") > -1){
					usersController.deselectAllRows();
				}
				else{
					usersController.selectRow(this);
				}
			}
			//indent a little
			var td = document.createElement('td');
			td.width = 20;
			tr.appendChild(td);
			//add the userName
			td = document.createElement('td');
			td.innerHTML = userName;
			tr.appendChild(td);
			tableBody.append(tr);
		}
	},
	deselectAllRows: function(){
		var userRows = $('.user_row')
		for(var i=0; i<userRows.length; ++i){
			userRows[i].className = userRows[i].className.replace(/ ui-state-highlight/g,'')
	    }
		this.selectedUser = null;
		this.updateUserSettingsForm(null);
		this.toggleUserSettingsForm(false);
	},
	selectRow: function(selectionRow)
	{
		//either the row was clicked or was passed a string for the contents we want selected
		var targetContents = ($.type(selectionRow) == "object")? selectionRow.cells[selectionRow.cells.length-1].innerHTML : selectionRow;
		var userRows = $('.user_row');
		for(var i=0; i<userRows.length; ++i){
			var rowContents = userRows[i].cells[userRows[i].cells.length-1].innerHTML;
			if(rowContents == targetContents){
				userRows[i].className += " ui-state-highlight";
				this.fetchUser(userRows[i].lastChild.lastChild.data);
			}
			else{
				userRows[i].className = userRows[i].className.replace(/ ui-state-highlight/g,'')
			}
	    }
	},
	fetchUser: function(userName)
	{
		var usersController = this;
		var query = "/"+usersController.bucketName+"/_user/"+userName;
        $.ajax({
          url: CROSS_DOMAIN_HANDLER_URL+"?sync_gateway_query="+encodeURIComponent(query),
          dataType: 'jsonp',
		  contentType: "application/json",
  		  jsonpCallback: 'jsonCallback',
          success: function (user) { 
			usersController.users[userName] = user;
			usersController.selectUser(user);
		  },
          error: function (jqXHR,error, errorThrown) {
			 usersController.handleError(jqXHR);
		  }
        });
	},
	selectUser: function(user){
		this.selectedUser = user;
		this.updateUserSettingsForm(user);
		this.toggleUserSettingsForm(user != null);
	},
	toggleUserSettingsForm: function(state)
	{
		for(var i=0; i<this.userKeys.length; i++){
			var key = this.userKeys[i];
			var input = $('input[name=user_'+key+']');
			if(input != undefined && input != null){
				if(key == "name" && state){
					// input.prop('disabled', !state);
				}
				else{
					input.prop('disabled', !state);
				}
			}
			input = $('label[class=for-'+key+']');
		}
		$('.save_button').prop('disabled', !state);
		$('.delete_button').prop('disabled', !state);
	},
	updateUserSettingsForm: function(user){
		for(var i=0; i<this.userKeys.length; i++){
			var key = this.userKeys[i];
			var value = (user != null && user.hasOwnProperty(key))? user[key].toString() : null;
			var field = $('input[name=user_'+key+']');
			if(field.length == 0){
				field = $('td[name=user_'+key+']');
			}
			if(field.prop('type') == "checkbox"){
				field.attr('checked', (typeof(value) == 'boolean')? value : false);
			}
			else if(field.prop('type') == "text"){
				field.val(value);
			}
			else{//td
				field.html(value);
			}
		}
	},
	saveUser: function(){
		if(this.selectedUser == null){
			return;
		}
		var jsonObject = {};
		for(var i=0; i<this.userKeys.length; i++){
			var key = this.userKeys[i];
			var field = $('input[name=user_'+key+']');
			var value = null;
			if(field.length == 0){
				continue;
			}
			if(field.prop('type') == "checkbox"){
				value = field.attr('checked');
			}
			else if(field.prop('type') == "text"){
				value = field.val();
			}
			if(value != null && value.length > 0){
				jsonObject[key] = (key.indexOf("admin_") != -1)? jsonArray(value) : value;
			}
		}
		var usersController = this;
		//make sure we get the sync_gateway_query so the remote script knows what url to use
		jsonObject["sync_gateway_query"] = "/"+usersController.bucketName+"/_user/"+this.selectedUser["name"];
		var jsonStr = JSON.stringify(jsonObject);
		// console.log("OUTGOING: "+jsonStr);
		$.ajax({
		    type: 'PUT',
		    url: CROSS_DOMAIN_HANDLER_URL,
		    crossDomain: true,
		    data: jsonStr,
		    dataType: 'json',
            success: function () {},
	        error: function () {},
			complete: function( jqXHR, textStatus ){
				if(jqXHR.responseText == undefined || jqXHR.responseText == ""){
					//empty json is ok
					usersController.fetchUser(usersController.selectedUser["name"]);
				}
				else{
					usersController.handleError(jqXHR);
				}
			}
		});
	},
	showUserManagement: function (uri){
		//parse the url
		this.URL = document.URL;
		this.URL = this.URL.substring(0, this.URL.indexOf("/index.html")); 
		//change the port to admin port
		var port = this.URL.substring(this.URL.lastIndexOf(":")+1);
		this.URL = this.URL.replace(port, "4985")
		this.bucketName = this.getBucketName(uri);
		//show the page
	    ThePage.ensureSection('buckets');
	    // we don't care about value, but we care if it's defined
	    DAL.cells.bucketsListCell.getValue(function (buckets) {
	      var bucketDetails = _.detect(buckets, function (info) {return info.uri === uri;});
	      if (!bucketDetails) {
	        return;
	      }
	      var modalSpinner = (function () {
	        var timeoutId = setTimeout(function () {
	          var d = genericDialog({
	            buttons: {},
	            closeOnEscape: false,
	            width: 320,
	            showCloseButton: false
	          });
	          d.spinner = overlayWithSpinner(d.dialog);
	          instance.close = function () {
	            d.spinner.remove();
	            d.close();
	          }
	        }, 100);
	        var instance = {
	          close: function () {
	            clearTimeout(timeoutId);
	          }
	        };
	        return instance;
	      })();

	      BucketsSection.settingsWidget.detailsMap.getValue(function (mapValue) {
	        var fullDetailsCell = mapValue.get(bucketDetails);
	        if (!fullDetailsCell) {
	          return;
	        }

	        var autoCompactionSettingsCell = Cell.compute(function (v) {
	          return AutoCompactionSection.getSettingsFuture();
	        });

	        var fullerDetailsCell = Cell.compute(function (v) {
	          var rv = _.extend({}, bucketDetails, v.need(fullDetailsCell));
	          var autoCompactionSettings = rv.autoCompactionSettings;
	          rv.autoCompactionDefined = ((autoCompactionSettings || false) !== false);
	          if (!autoCompactionSettings) {
	            var globalSettings = v.need(autoCompactionSettingsCell);
	            _.extend(rv, globalSettings);
	          }
	          return rv;
	        });

	        fullDetailsCell.setValue(undefined);
	        BucketsSection.settingsWidget.openElement(bucketDetails.name);
	        fullerDetailsCell.changedSlot.subscribeOnce(withDetails);
	        fullDetailsCell.invalidate();

	        return;

	        function withDetails() {
	          var initValues = _.clone(fullerDetailsCell.value);
	          var autoCompactionSettings = initValues.autoCompactionSettings;
	          _.each(autoCompactionSettings, function (value, k) {
	            if (value instanceof Object) {
	              _.each(value, function (subVal, subK) {
	                initValues[k+'['+subK+']'] = subVal;
	              });
	            } else {
	              initValues[k] = value;
	            }
	          });

	          modalSpinner.close();

	          var dialog = new UserManagementDetailsDialog(initValues, false);

	          BucketsSection.currentlyShownBucket = bucketDetails;
	          dialog.startDialog();
			  $("#container").css("position", "fixed");
	        };
	      });
	    });
	},
	toggleMode: function (mode)
	{
		if(mode == 'create'){
			var h = $("#header-title");
			h.html("<a onclick=\"usersController.toggleMode('edit');\">Edit</a> / Create");
		}
		
	},
	createNewUser: function(){
		var userName = $('#new_user_input').get(0).value;
		if(userName == null || userName.length == 0){
			return;
		}
		userName = userName.replace(/[^a-zA-Z0-9_]+/g, '');
		if(this.users.hasOwnProperty(userName)){
			this.handleError({responseText:"User Already Exists"});
			return;
		}
		
		var usersController = this;
		var jsonObject = {name: userName, password:"password"};
		//make sure we get the sync_gateway_query so the remote script knows what url to use
		jsonObject["sync_gateway_query"] = "/"+usersController.bucketName+"/_user/"+userName;
		var jsonStr = JSON.stringify(jsonObject);
		// console.log("OUTGOING: "+jsonStr);
		$.ajax({
		    type: 'POST',
		    url: CROSS_DOMAIN_HANDLER_URL,
		    crossDomain: true,
		    data: jsonStr,
		    dataType: 'json',
			success: function(){},
			error: function(){},
			complete: function( jqXHR, textStatus ){
				if(jqXHR.responseText == undefined || jqXHR.responseText == ""){
					//empty json is ok
					usersController.fetchAllUsers(userName);
				}
				else{
					usersController.handleError(jqXHR);
				}
			}
		});
		
	},
	handleError: function(jqXHR, error, errorThrow)
	{
		if(jqXHR.responseText == undefined || jqXHR.responseText == ""){
			//it's not an error, it's just empty json
			return;
		}
		// alert(jqXHR.responseText);
        genericDialog({buttons: {ok: true},
                       header: "Error",
                       text: jqXHR.responseText});
	},
	deleteSelectedUser: function(){
		if(this.selectedUser == null || this.selectedUser == undefined){
			return;
		}
		var usersController = this;
		var jsonObject = {delete_user:true, sync_gateway_query: "/"+this.bucketName+"/_user/"+this.selectedUser["name"]};
		var jsonStr = JSON.stringify(jsonObject);
		$.ajax({
		    type: 'DELETE',
		    url: CROSS_DOMAIN_HANDLER_URL,
		    crossDomain: true,
		    data: jsonStr,
		    dataType: 'json',
			success: function(){},
			error: function(){},
			complete: function( jqXHR, textStatus ){
				hideDialog("user_remove_dialog");
				if(jqXHR.responseText == undefined || jqXHR.responseText == ""){
					//empty json is ok
					usersController.selectUser(null);
					usersController.fetchAllUsers();
				}
				else{
					usersController.handleError(jqXHR);
				}
			}
		});
		
	}
};

//create the UsersController
var usersController = UsersController;
//configure for the Users button
configureActionHashParam("userManagement", $m(UsersController, 'showUserManagement'));

//add the dialog
var div = document.createElement("div");
div.id = "users_dialog";
$( div ).load( "extensions/com.joelsaltzman.user_management/users_dialog.html" );
var body = document.getElementsByTagName('body')[0];
body.appendChild(div);
