# password generation

You need to have one file per user (username.pwd).
The file content must be a SHA-512 hash of a string containing 
the concataination of "FRDDomotics-" (the salt) username and password.

```bash
echo -n "FRDDomotics-UsermamePassword" | shasum -a 512 | awk '{print tolower($1)}' > Username.pwd
```

Additionaly you can run the ``genpwd.sh`` script in this folder.
