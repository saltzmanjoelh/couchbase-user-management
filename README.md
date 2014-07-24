This is a working sample of my request to add user management to the couchbase server web app.

It adds a button to the Bucket<br/>
![alt tag](https://raw.github.com/saltzmanjoelh/couchbase-user-management/master/readme_images/users_button.png)

When pressed it will present the User Management for the Bucket<br/>
![alt tag](https://raw.github.com/saltzmanjoelh/couchbase-user-management/master/readme_images/user_management.png)

Unless I missed something, the sync_gateway doesn't allow cross domain requests by default. I would be interested to know if it allows CORS via the config file though. I created the cross_domain_handler.php file to handle ajax requests from the Couchbase webserver, parses a little info and sends it to the sync_gateway.


<h1>Instructions</h1>

We will be working in the Couchbase webserver root directory. On a Mac, it is here:
<b>/Applications/Couchbase\ Server.app/Contents/Resources/couchbase-core/lib/ns_server/erlang/lib/ns_server/priv/public/</b>

<h2>Step 1</h2>
cross_domain_handler.php needs to go on the computer with the sync_gateway. Since I'm working with everything on my Mac I just copied it to my apache directory.<br/>
```cp /Users/joelsaltzman/Downloads/couchbase\ user\ management/cross_domain_handler.php /Library/Server/Web/Data/Sites/Default```<br/>

<b>If your path is different, make sure to update the CROSS_DOMAIN_HANDLER_URL variable at the top of the user_management.js directory</b>

<h2>Step 2</h2>
Apply the patch to the Couchbase webserver's index file.<br/>
```patch /Applications/Couchbase\ Server.app/Contents/Resources/couchbase-core/lib/ns_server/erlang/lib/ns_server/priv/public/index.html < /Users/joelsaltzman/Downloads/couchbase\ user\ management/index.html.patch```<br/>

It will add 2 lines of code to the index file.<br/>
![alt tag](https://raw.github.com/saltzmanjoelh/couchbase-user-management/master/readme_images/users_button_code.png)<br/>
![alt tag](https://raw.github.com/saltzmanjoelh/couchbase-user-management/master/readme_images/user_management_code.png)<br/>


<h2>Step 3</h2>
Copy the extensions directory to the root of the Couchbase webserver directory
```cp -r extensions /Applications/Couchbase\ Server.app/Contents/Resources/couchbase-core/lib/ns_server/erlang/lib/ns_server/priv/public/```<br/>
