This is my rough draft request for adding user management to the couchbase server web app.

I need to make a patch file. In the meantime, here is what to do to get started:

1) In the couchbase index.html (/Applications/Couchbase Server.app/Contents/Resources/couchbase-core/lib/ns_server/erlang/lib/ns_server/priv/public/index.html): 
after line 2927 ```<script src="js/app.js"></script>``` add
```<script src="extensions/com.joelsaltzman.user_settings/user_settings.js"></script>```

Example: ![alt tag](https://raw.github.com/saltzmanjoelh/couchbase-user-management/master/readme_images/user_settings_script.png)


2) after line 623 right befor the closing div ```<button class="inner_btn cancel_compact_btn {%= disableCancel ? 'dynamic_disabled' : ''%}" data-uri="{%= h(thisBucketCompactionTask.cancelURI) %}"><span>Cancel</span></button>{% } %}``` add

```<a class="inner_btn" href="#userSettings={%= h(encodeURIComponent(uri)) %}">Users</a>```

Example: ![alt tag](https://raw.github.com/saltzmanjoelh/couchbase-user-management/master/readme_images/users_button.png)