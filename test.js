var frdApn = require('./FRDDomoticsAPN.js');

frdApn.sendApnNotification({
                                'alert': "test",
                                'sensor_id': 1,
                                'measurement_type': "level",
                                });