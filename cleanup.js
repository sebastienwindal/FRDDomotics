var _ = require('underscore');
var fs = require('fs');
var path = require('path');
var storage = require('./FRDDomoticsStorage.js');

var d = new Date();

var d2 = new Date(  d.getFullYear(), 
                    d.getMonth(),
                    d.getDate(), 
                    d.getHours(), 
                    0, 0, 0);

var date = new Date(d2.getTime() - 7 * 24 * 3600 * 1000);

storage.RemoveRawMeasurementOlderThan(2, "temperature", date, function() {
    console.log("removed all temperature raw records older than " + date);
}, function(err) {
    console.log("Failed to remove temperature raw measurements. error: " + err);
});

storage.RemoveRawMeasurementOlderThan(2, "humidity", date, function() {
    console.log("removed all humidity raw records older than " + date);
}, function(err) {
    console.log("Failed to remove humidity raw measurements. error: " + err);
});

storage.RemoveRawMeasurementOlderThan(2, "luminosity", date, function() {
    console.log("removed all luminosity raw records older than " + date);
}, function(err) {
    console.log("Failed to remove luminosity raw measurements. error: " + err);
});