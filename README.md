This is my rough draft request for adding user management to the couchbase server web app.

I need to make a patch file. In the meantime, here is what to do to get started:

1) In the couchbase index.html (/Applications/Couchbase Server.app/Contents/Resources/couchbase-core/lib/ns_server/erlang/lib/ns_server/priv/public/index.html): 
after line 2927 ```<script src="js/app.js"></script>``` add
```<script src="extensions/com.joelsaltzman.user_settings/user_settings.js"></script>```

Example: ```<script src="js/app.js"></script>\n<script src="extensions/com.joelsaltzman.user_settings/user_settings.js"></script>\n</body>```




2) after line 623 right befor the closing div ```<button class="inner_btn cancel_compact_btn {%= disableCancel ? 'dynamic_disabled' : ''%}" data-uri="{%= h(thisBucketCompactionTask.cancelURI) %}"><span>Cancel</span></button>{% } %}``` add

```<a class="inner_btn" href="#userSettings={%= h(encodeURIComponent(uri)) %}">Users</a>```


Example: ```<button class="inner_btn cancel_compact_btn {%= disableCancel ? 'dynamic_disabled' : ''%}" data-uri="{%= h(thisBucketCompactionTask.cancelURI) %}"><span>Cancel</span></button>\n{% } %}\n<a class="inner_btn" href="#userSettings={%= h(encodeURIComponent(uri)) %}">Users</a>\n</div>```