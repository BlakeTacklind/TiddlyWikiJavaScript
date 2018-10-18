
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
	"use strict";
	const DEFAULT_CALENDAR = "PCC";
	var setup = true;

	const HOURS_PER_DAY = 24;
	const MINUTES_PER_HOUR = 60;
	const SECONDS_PER_MINUTE = 60;

	Number.prototype.pad = function(size) {
		var s = String(this);
		while (s.length < (size || 2)) {s = "0" + s;}
		return s;
	}

	class EventObject{
		constructor(Calendar_List, time_string, event_name, event_tag, event_location=""){
			this.time_obj = parseStringTime(Calendar_List, time_string);
			this.event_name = event_name;
			this.event_tag = event_tag;
			this.Calendar_List = Calendar_List;
			this.location=event_location;
		}

		get_gt(){
			return this.time_obj;
		}

		get_time(type){
			if (type == undefined || type == "") type = DEFAULT_CALENDAR;
			return this.Calendar_List[type].get_string(this.time_obj);
		}

	}

	function compareTimeObjects(TO1, TO2){
		return TO1.get_gt() - TO2.get_gt();
	}

	class Calendar{
		constructor(abbreviation, json_data){
			this.valid = false;

			if (abbreviation == undefined || abbreviation == "" || typeof abbreviation != "string"){
				console.error("Calendars require an abbreviation");
				return;
			}
			this.abbreviation = abbreviation;

			//Get the calendars name
			if (json_data.name == undefined || json_data.name == "" || typeof json_data.name != "string") {
				console.warn("Calendar doesn't have a name, giving it the abbreviation "+this.abbreviation);
				this.name = this.abbreviation;
			}
			else {this.name = json_data.name};

			//Set up reference date
			if (json_data.ref != undefined && json_data.ref != ""){
				this.ref_string = json_data.ref;
			}
			else{
				//Only god time should not have a reference point.
				if (this.abbreviation != "GT"){
					console.error("Calendar "+this.name +" doesn't have a start date");
					return;
				}

				this.ref_string = "0 GT";
				this.reference = 0;
			}

			//get start date
			if (json_data.year_len == undefined || isNaN(json_data.year_len)){
				console.error("Calendar "+this.name+" doesn't have a number of days");
				return;
			}
			this.year_len = json_data.year_len;

			//Get month by month data
			if (json_data.n_months != json_data.months.length) {
				console.error("Calendar "+this.name+" doesn't have the right number of months");
				return;
			}
			this.months = new Array();
			var pos = 0;
			for (var i = 0; i < json_data.n_months; i++) {
				this.months.push({name:json_data.months[i], length:json_data.month_len[json_data.months[i]], position:pos});
				pos += json_data.month_len[json_data.months[i]];
			}
			if (pos != this.year_len){
				console.error("Calendar "+this.name+" has "+pos+" days worth of months and has "+this.year_len+" days in a year");
				return;
			}

			this.valid = true;
		}

		//prints date from god time to this calendar
		get_string(god_time){
			if (!this.valid){
				console.error(this.name+" is not a valid Calendar");
				return undefined;
			}

			if (isNaN(god_time)){
				console.error("getString requires a number!");
				return undefined;
			}

			var relative_time = god_time - this.reference;

			//get year
			var year = Math.floor(relative_time/this.year_len);

			var day = Math.floor(relative_time)%this.year_len;

			//get month
			var month;
			for (month = this.months.length - 1; month > 0; month--){
				//I don't like this break but i think its safer then having
				//a while loop potentially run forever
				if (day > this.months[month].position) break;
			}

			//get day
			day -= this.months[month].position;

			const date_string = (day+1).toString()+"/"+(month+1).toString()+"/"+year.toString();

			var time_of_day = relative_time % 1;
			var clock_string = ""

			if (time_of_day > 0){
				time_of_day += 0.0000001;
				time_of_day *= HOURS_PER_DAY;
				var hour = Math.floor(time_of_day);
				time_of_day -= hour;
				time_of_day *= MINUTES_PER_HOUR;
				var minute = Math.floor(time_of_day);

				clock_string = hour.toString()+":"+minute.pad(2);

				time_of_day -= minute;
				time_of_day *= SECONDS_PER_MINUTE;
				if (Math.floor(time_of_day + 0.000001) > 0){
					//persion to .001 seconds
					clock_string += ":"+Math.floor(time_of_day).pad(2);
				}

				clock_string += " ";
			}

			//Now put it all together
			return clock_string + date_string+" "+this.abbreviation;
		}
	}

	function parseStringTime(Calendar_List, time_string){
		try{
			var timeStringRegex = /^(?:(\d+)(?:\:(\d+)(?:\:(\d+(?:\.\d+)?))?)? )?(?:(\d+)\/(?:(\d+)\/)?)?(-?\d+)(?: (\w+))?$/;

			var match = timeStringRegex.exec(time_string);

			if (!match){
				console.error("Improperly formed date string: "+ time_string);
				return NaN;
			}

			var calendar = match[7];
			if (!calendar){
				calendar = DEFAULT_CALENDAR;
			}

			if (Calendar_List[calendar] == undefined){
				//This should only happen durning setup
				if (!setup) console.error("Abbreviation " + calendar + " does not exist");
				return NaN;
			}

			var hour = match[1]?parseInt(match[1]):0;
			var minute = match[2]?parseInt(match[2]):0;
			var second = match[3]?parseInt(match[3]):0;
			var day = match[4]?parseInt(match[4])-1:0;
			var month = match[5]?parseInt(match[5])-1:0;
			var year = parseInt(match[6]);

			const cal = Calendar_List[calendar];

			return cal.reference +
				cal.year_len * year +
				cal.months[month].position +
				day +
				(hour + ((minute + (second / SECONDS_PER_MINUTE)) / MINUTES_PER_HOUR)) / HOURS_PER_DAY;
		}
		catch(err){
			console.error("Failed to parse date string: "+ time_string+". "+err);
		}
	}

	//Sort the Calendars into a useful order
	function GetRelativeCalendars(Calendar_List, tmpCalendarList){
		//Check if empty
		if (Object.keys(Calendar_List).length === 0){
			console.error("We need at least 1 'God Time' calendar");
			return;
		}

		setup = true;

		//just run through the list at most the length of the temp list
		//this should keep the problem bounded
		for (var attempts = tmpCalendarList.length - 1; attempts >= 0; attempts--) {

			//Should be free to splice because iterating in reverse
			for (var index = tmpCalendarList.length - 1; index >= 0; index--) {
				var tmp_ref = parseStringTime(Calendar_List, tmpCalendarList[index].ref_string);

				if (!isNaN(tmp_ref)){
					tmpCalendarList[index].reference = tmp_ref;
					Calendar_List[tmpCalendarList[index].abbreviation] =
						tmpCalendarList[index];
					tmpCalendarList.splice(index, 1);
				}
			}

			//Done lets break, only need this if the list of calendars gets rediculous
			// if(tmpCalendarList.length == 0) break;
		}

		setup = false;
	}

	function GetCalendarList(wiki){
		//Get calendar data
		const CALENDAR_START_STRING = "$:/Calendar/Custom/";

		//Parse all calendars in wiki
		var Calendar_List = {};
		var tmpCalendarList = new Array();
		wiki.each(function(tiddler, title){
			if(title.startsWith(CALENDAR_START_STRING)){
				var json_obj = JSON.parse(tiddler.fields.text);

				var tmp = new Calendar(title.substring(CALENDAR_START_STRING.length), json_obj);

				if (tmp.valid){
					//this should be the God Time (or reference time)
					if (tmp.reference != undefined){
						Calendar_List[tmp.abbreviation] = tmp;
					}
					else{
						tmpCalendarList.push(tmp);
					}

				}
				else{
					console.error("Bad Calendar");
					console.log(tmp);
				}
			}
		});

		GetRelativeCalendars(Calendar_List, tmpCalendarList);

		//Get the time of Now, doesn't work currently
		// var CURRENT_TIME = parseStringTime(wiki.getTiddler("Now").fields.time);

		return Calendar_List;
	}

	exports.GetCalendarList = GetCalendarList;

	exports.EventObject = EventObject;

	exports.compareTimeObjects = compareTimeObjects;

	exports.DEFAULT_CALENDAR = DEFAULT_CALENDAR;

	exports.parseStringTime = parseStringTime;

})();
