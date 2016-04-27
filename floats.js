var SteamUser = require('steam-user');
var GlobalOffensive = require('globaloffensive');
var Steam = SteamUser.Steam;
var fs = require("fs");
var util = require("util");

var client = new SteamUser({"promptSteamGuardCode":false});
var csgo = new GlobalOffensive(client);

var gui = require('nw.gui'); 

// Get the current window
var win = gui.Window.get();
win.maximize();
//win.showDevTools();
win.on("close",function(){
	if(typeof window.market!=="undefined"){
		window.market.close();
	}
	client.logOff();
	process.exit(0);
});
var ranks = [
"Unranked",
"Silver I",
"Silver II",
"Silver III",
"Silver IV",
"Silver Elite",
"Silver Elite Master",
"Gold Nova I",
"Gold Nova II",
"Gold Nova III",
"Gold Nova Master",
"Master Guardian I",
"Master Guardian II",
"Master Guardian Elite",
"Distinguished Master Guardian",
"Legendary Eagle",
"Legendary Eagle Master",
"Supreme Master First Class",
"The Global Elite"
]

function login() {
		$('.Window').fadeOut(250);
		var username = $("#username").val();
		var password = $("#password").val();
		$('#LoadingWindow p').html("Initializing Steam client...");
		$('#LoadingWindow').fadeIn(250);
		//Clear Password Field
		util.log("Initializing Steam client...");
		//Login to steam client
		client.logOn({
			"accountName": username,
			"password": password
		});
		$("#password").val("");
}

function floatvalue(incorrectfloat){
	buf = new Buffer(4);
	buf.writeUInt32LE(+incorrectfloat, 0);
	return buf.readFloatLE(0).toString()
}

client.on('steamGuard', function(domain, callback, lastcode) {
	if (lastcode===true){
		$('#LoadingWindow .Error').html('<i class="fa fa-exclamation-circle"></i> Invalid Code');
	}else{
		$('#LoadingWindow .Error').html("");;
	}
	
	if (domain != null ){
		auth_msg = "Auth Code\nEmailed to address @" + domain + ":";
	} else {
		auth_msg = "Mobile Auth Code:";
	}
	
	$('#LoadingWindow p').html(auth_msg + '<form id="authCodeForm" ><input id="authCode" class="input-lg form-control" /><button type="submit" class="btn btn-block" >Send</button></form>');
	$("#authCode").focus();
	$("#authCodeForm").on("submit",function(e){
		e.preventDefault();e.stopPropagation();
		code = $("#authCode").val();
		$('#LoadingWindow p').html("Initializing Steam client...");
		callback(code);
	});
});

client.on('loggedOn', function() {
	client.gamesPlayed("730");
	client.setPersona(1);
	$('.Error').html("");
	util.log("Logged into Steam!");
	$("#AppLogout").fadeIn(250);
	$("#AppClose").attr("onclick","client.logOff();process.exit(0);");
	$('#LoadingWindow p').html("Loading User Info...");
	var getProfile = setInterval(function(){csgo.requestPlayerProfile(client.steamID.accountid)},1000);
	csgo.once("playerProfile", function(data){
		clearInterval(getProfile);
		client.getPersonas([steamID],function(response){$("#UserWindow #Name").html(response[steamID].player_name);console.log(response);});
		$(".Window").hide(250);
		if (typeof data.account_profiles[0].ranking.rank_id != "undefined" && typeof ranks[data.account_profiles[0].ranking.rank_id] != "undefined"){
			$("#RankName").html(ranks[data.account_profiles[0].ranking.rank_id]);
			$("#RankImage").attr("src","include/images/"+data.account_profiles[0].ranking.rank_id+".jpg");
		}else{
			$("#RankName").html("Unranked/Unknown");
			$("#RankImage").attr("src","include/images/0.jpg");
		}
		$("#Wins").html('<i class="fa fa-trophy" aria-hidden="true"></i> '+data.account_profiles[0].ranking.wins);
		/*
		var cmd_friendly = data.account_profiles[0].commendation.cmd_friendly;
		var cmd_leader = data.account_profiles[0].commendation.cmd_leader;
		var cmd_teaching = data.account_profiles[0].commendation.cmd_teaching;
		*/
		$("#UserWindow").show(250);
		if (typeof window.market==="undefined"){
			window.market = gui.Window.open ("http://steamcommunity.com/market/search?appid=730", {
				"icon": "logo.png",
				position: 'center'
			});
			window.market.maximize();
		}
	});
	console.log(client);
	steamID=client.client.steamID;
	accountID=client.steamID.accountid;
});

client.on('error', function(e) {
	$("#password").val("");
	util.log("Error: " + e);
	client.logOff();
	if(e == "Error: InvalidPassword"){
		$("#LoginWindow .Error").html('<i class="fa fa-exclamation-circle"></i> Wrong username/password');
	} else if (e == "Error: util.loggedInElsewhere" || e=="Error: util.logonSessionReplaced"){
		$("#LoginWindow .Error").html('<i class="fa fa-exclamation-circle"></i> In Game Elsewhere!');
	}else{
		$("#LoginWindow .Error").html('<i class="fa fa-exclamation-circle"></i> '+e);
	}
	$('.Window').fadeOut(250);
	$("#LoginWindow").fadeIn(250);
	win.focus();
});

$(document).ready(function(){
	$("#LoginForm").on("submit",function(e){
		e.preventDefault();e.stopPropagation();
		login();
	})
	
	setInterval(function(){
		if (typeof window.market==="undefined"){
			return;
		}
		if(window.market.window.location.pathname.indexOf("market")>=0 && $(window.market.window.document).find("[href*=listings]").not("[href*=count]").length>0){
			$(window.market.window.document).find("[href*=listings]").not("[href*=count]").each( function(e) {
				var href = $(this).attr("href");
				$(this).attr("href",href+"?count=100");
			});
		}
		if (typeof window.market.window.g_rgListingInfo!=="undefined" && $(window.market.window.document).find('.market_listing_row .market_listing_seller').length>0){
			$(window.market.window.document).find(".market_listing_seller").addClass("market_listing_wear").removeClass("market_listing_seller").html("WEAR").css("width","200px");
			$(window.market.window.document).find('.market_listing_row').each( function(e) {
				var listingID = $(this).attr('id').replace('listing_', '');
				if (listingID=="market_buyorder_info"){
					$(window.market.window.document).find('.market_listing_table_header').attr("data-float","0").attr("data-price","0");
					return;
				}
				$(this).find('.market_listing_wear').removeClass("market_listing_wear").html("<span id='" + window.market.window.g_rgListingInfo[listingID].asset.id + "' class='inspectLink' link='M" + listingID + "A"+ window.market.window.g_rgListingInfo[listingID].asset.id + "D" + window.market.window.g_rgListingInfo[listingID].asset.market_actions[0].link.replace('steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20M%listingid%A%assetid%D', '') + "'>Loading...</span>");
				if (typeof $(this).find(".market_listing_price_with_fee").html() != "undefined"){
					var price = $(this).find(".market_listing_price_with_fee").html().replace(",",".").replace(/[^0-9\.]+/ig, "");
					$(this).attr("data-price",price);
				}
			});
			$(window.market.window.document).find(".market_listing_wear").click(function(){
				var mainlisting = $(window.market.window.document).find('#searchResultsRows')
				$(window.market.window.document).find('[data-float]').sort(function(a,b){
				 return a.dataset.float - b.dataset.float;
				}).prependTo(mainlisting);
			});
			$(window.market.window.document).find(".market_listing_table_header .market_listing_their_price").click(function(){
				var mainlisting = $(window.market.window.document).find('#searchResultsRows')
				$(window.market.window.document).find('[data-price]').sort(function(a,b){
				 return a.dataset.price - b.dataset.price;
				}).prependTo(mainlisting);
			});
		}
		if ($(window.market.window.document).find('.inspectLink').length>0){
			arr = $(window.market.window.document).find('.inspectLink').eq(0).attr("link").match(/[SM]([0-9]*)A([0-9]*)D([0-9]*)/);
			var firstS = arr[0] === 'S';
			var param_s = firstS ? arr[1] : '0';
			var param_m = firstS ? '0' : arr[1];
			var param_a = arr[2];
			var param_d = arr[3];
			csgo.requestItemForUser(param_s, param_a, param_d, param_m);
			csgo.once("itemList"+param_a, function (itemListResponse){	
				var incorrectfloat = itemListResponse.iteminfo.paintwear;
				var realfloat = floatvalue(incorrectfloat);
				var percent = realfloat.substr(2,1)==="0"?realfloat.substr(3,1):realfloat.substr(2,2);
				$(window.market.window.document).find('#'+param_a).removeClass('inspectLink').html(percent+"."+realfloat.substr(4,4)+" %").parent().parent().attr("data-float",realfloat.substr(2,7));
			});
		}
	},500);
});
