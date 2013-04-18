# How to generate certificates files

Follows instructions found [http://panoptic.com/wiki/aolserver/How_to_generate_self-signed_SSL_certificates](here), which
consist of:

## Create a key file

```bash
openssl genrsa -out key.pem 1024
```

## Create a certificate request for the key

```bash
openssl req -new -key key.pem -out request.pem
```

## Create a self signed cert (for development purposes)

```bash
openssl x509 -req -days 30 -in request.pem -signkey key.pem -out certificate.pem
```