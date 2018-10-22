/*\
Example:
<<TitleMacro>>

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
This is the TimeLineMacro of Tiddly Wiki 5 written in JavaScript
It is used for creating the list of titles a person has
*/
var shared = require("$:/macro/SharedData.js");

exports.name = "TitleMacro";

exports.params = [
	{name: "input"},
];

function convert_to_object(text){
	const specialCharacters = /[^a-zA-Z0-9'\- ]/g

	try{
		return (JSON.parse(text));
	}
	catch(e){
		if (specialCharacters.test(text)){
			console.error("Has special characters and not a json object "+text);
			return undefined;
		}
		else{
			return text;
		}
	}
}

class TitleObject{
	constructor(name, recieved=undefined, revoked=undefined){
		this.name = name;
		this.recieved = recieved;
		this.revoked = revoked;
	}
}

function isString(value){
	return typeof value === 'string' || value instanceof String;
}

function makeTitle(item){
	if(typeof item === "object"){
		if (!isString(item.name) || item.name == ""){
			return undefined;
		}
		else{
			return new TitleObject(item.name, item.recieved, item.revoked);
		}
	}
	else if(isString(item)){
		return new TitleObject(item);
	}

	return undefined;
}

function getTitles(input){
	if (input == ""){
		return [];
	}

	var converted = convert_to_object(input);

	console.log(converted);

	if (converted === undefined){
		return undefined;
	}

	if (Array.isArray(converted)){
		return converted.reduce(function (acc, val) {
				if(!Array.isArray(acc)){return undefined;}
				var v = makeTitle(val);
				if(v === undefined){return undefined;}
				else{
					acc.push(v);
					return acc;
				}
			},
			new Array());
	}

	var title = makeTitle(converted);

	if (title){
		return [title];
	}

	return undefined;
}

/*
Run the macro
*/
exports.run = function(input) {
	var titles = getTitles(input);

	if (titles === undefined){
		console.error("Unsuccesful title(s) creation");
		return "MALFORMED TITLES";
	}

	var formatted_titles = titles.reduce(function(acc, val, index){
			return acc + (index!=0?", [[":"[[")+val.name+"]]";
		},
		"");

	if (formatted_titles){
		return "''Titles:'' "+
			formatted_titles;
	}

	return "";
};

})();
