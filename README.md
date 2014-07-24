This is a working sample of my request to add user management to the couchbase server web app.

It adds a button to the Bucket<br/>
Example: ![alt tag](https://raw.github.com/saltzmanjoelh/couchbase-user-management/master/readme_images/users_button.png)

When pressed it will present the User Management for the Bucket<br/>
Example: ![alt tag](https://raw.github.com/saltzmanjoelh/couchbase-user-management/master/readme_images/user_management.png)


Apply the patch to the Couchbase webserver's index file.
ie: patch <b>/Applications/Couchbase\ Server.app/Contents/Resources/couchbase-core/lib/ns_server/erlang/lib/ns_server/priv/public/index.html</b> < /Users/joelsaltzman/Downloads/couchbase\ user\ management/index.html.patch 

It will add 2 lines of code to the index file.
Example: ![alt tag](https://raw.github.com/saltzmanjoelh/couchbase-user-management/master/readme_images/users_button_code.png)
Example: ![alt tag](https://raw.github.com/saltzmanjoelh/couchbase-user-management/master/readme_images/user_management_code.png)