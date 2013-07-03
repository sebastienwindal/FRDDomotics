---
layout: default
title: FRDDomotics
helloworld: yo mama
tagline: Home automation with Raspbery pi, Z-wave, nodeJS and cocoa.
---


## Hardware

* [A raspbery pi](http://www.amazon.com/Raspberry-Pi-Model-Revision-512MB/dp/B009SQQF9C/ref=sr_1_1?ie=UTF8&qid=1372893768&sr=8-1&keywords=raspberry+pi) and a [z-wave GPIO daugther card](http://www.amazon.com/Z-Wave-Razberry-Pi-GPIO-Daughter-Card/dp/B00BL9QFH6/ref=pd_rhf_se_p_t_2_TJ5S).

![](images/Razberry-zwave1.jpg)

The ZWave controller is the small card on top of the pi, it costs about twice as much as the pi.

* an assortments of z-wave sensors.

My setup currently includes 2 [aeon labs multi-sensors](http://www.amazon.com/Aeon-Labs-DSB05106-ZWUS-Z-Wave-Multi-sensor/dp/B008D5TYGU/ref=sr_1_fkmr0_1?ie=UTF8&qid=1372893939&sr=8-1-fkmr0&keywords=insteon+multi-+sensor) (temperature, humidity and luminosity), 1 [aeon labs door/window sensor](http://www.amazon.com/Aeon-Labs-Z-Wave-Window-Sensor/dp/B004ETD4VU/ref=pd_sim_hi_4) and one [Schlage door/window sensor](http://www.amazon.com/Schlage-RS100HC-SL-Window-Intelligence/dp/B008Q5CTBE/ref=pd_sim_hi_1).


## Software, back end

Mostly a MEAN stack, even though I really am not doing anything with express.

* nodeJS server
* mongodb
* Angular for a test website.
* restify for my REST API
* push notifications
* proxy stuff

## Software, a __NATIVE__ iPhone App

I saved this in a separate repo iFRDDomotics.

REST client: AFNetworking and Mantle

Few screen shots:

![](images/iphone1_.png)
![](images/iphone2_.png)
![](images/iphone3_.png)
![](images/iphone4_.png)
![](images/iphone5_.png)
![](images/iphone6_.png)
![](images/iphone7_.png)
![](images/iphone8_.png)
![](images/iphone9_.png)