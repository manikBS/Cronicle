// Cronicle Server Scheduler
// Copyright (c) 2023 Manik Somayaji
// Released under the MIT License

var moment = require('moment-business-days');

var Class = require("pixl-class");

module.exports = Class.create({
    holidayCal: new Map(),

    setupHolidayCalendar: function(){
        var self = this;
        this.storage.listGet( 'global/holiday_cal', 0, 0, function(err, items) {
            for (var idx = 0, len = items.length; idx < len; idx++) {
                var item = items[idx];
                self.logDebug(3, item);
                self.holidayCal.set(item.timezone, {
                    "holidays": item.holidays,
                    "holidayFormat": item.holidayFormat,
                    "workingWeekdays": item.workingWeekdays
                });
            }
        });
    },

    checkToTriggerWeekdays: function(timing, margs, timezone, dateCalcType, triggerBefore){
        this.logDebug(3, "--------------");
        if(dateCalcType==='Calendar')
            return timing.weekdays && timing.weekdays.length && (timing.weekdays.indexOf(moment(margs).add(triggerBefore, 'd').day()) == -1)
        else if(dateCalcType==='Business'){
            this.logDebug(3, "--------------");
            this.logDebug(3, margs.isBusinessDay());
            if(!margs.isBusinessDay())
                return true;

            var triggerbday = margs.businessAdd(triggerBefore, 'd');
            var previousbday = moment(triggerbday).prevBusinessDay();
            var list = [];
            var i = previousbday.day()+1
            while (i != triggerbday.day()) {
                list.push(i);
                i = (i+1) % 7;
            }
            return timing.weekdays && timing.weekdays.length && (timing.weekdays.indexOf(triggerbday.day()) == -1) 
                && !(timing.weekdays.filter(day => list.indexOf(day) != -1).length);  
            }
    },

    checkToTriggerDayOfMonth: function(timing, margs, timezone, dateCalcType, triggerBefore){
        if(dateCalcType==='Calendar')
            return timing.days && timing.days.length && (timing.days.indexOf(moment(margs).add(triggerBefore, 'd').date()) == -1)
        else if(dateCalcType==='Business'){
            if(!margs.isBusinessDay())
                return true;
            if(!(timing.days && timing.days.length))
                return false;
            var triggerbday = margs.businessAdd(triggerBefore, 'd');
            var monthbusinessdays = triggerbday.monthBusinessDays();
            var bd = 0;
            var nbds = monthbusinessdays.length;
            while(true){
                if(monthbusinessdays[bd].date() === triggerbday.date())
                    break;
                bd = bd + 1;
                if(bd>=nbds)
                    break;
            }
            return (timing.days.indexOf(bd+1) == -1);
        }
    }

});