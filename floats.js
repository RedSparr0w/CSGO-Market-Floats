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
				$(this).find('.market_listing_wear').removeClass("market_listing_wear").html("<span id='" + window.market.window.g_rgListingInfo[listingID].asset.id + "' class='inspectLink' link='M" + listingID + "A"+ window.market.window.g_rgListingInfo[listingID].asset.id + "D" + window.market.window.g_rgListingInfo[listingID].asset.market_actions[0].link.replace('steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20M%listingid%A%assetid%D', '') + "'>In Queue</span>");
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
			$(window.market.window.document).find('body').append('<style>h4.wear{z-index:-1;position:absolute;}.market_home_listing_table .market_listing_right_cell {position: relative;}.wear div{position:relative}.wear{position:relative;display:block;text-align:center;z-index:99;width:90%;text-align:center;top:25px;left:5%;right:5%;height:20px;transition:.8s ease-out}.wear div{height:100%;display:inline-block;float:left;transition:.8s}.wear:hover>.fn{width:7%!important}.wear:hover>.mw{width:8%!important}.wear:hover>.ft{width:23%!important}.wear:hover>.ww{width:7%!important}.wear:hover>.bs{width:55%!important}.pointer{position:absolute !important;bottom:22px;z-index:1000}.pointer img{position:absolute;top:0px;left:0px;}</style>');
		}
		if ($(window.market.window.document).find('.inspectLink').length>0){
			if ($(window.market.window.document).find('.inspectLink').eq(0).html().length < 10){
				$(window.market.window.document).find('.inspectLink').eq(0).html("<div><svg version='1.1' x='0px' y='0px' width='24px' height='30px' viewBox='0 0 24 30'><rect x='0' y='5' width='4' height='20' fill='#FFF' opacity='0.2'><animate attributeName='opacity' attributeType='XML' values='0.2; 1; .2' begin='0s' dur='0.6s' repeatCount='indefinite'></animate><animate attributeName='height' attributeType='XML' values='10; 20; 10' begin='0s' dur='0.6s' repeatCount='indefinite'></animate><animate attributeName='y' attributeType='XML' values='10; 5; 10' begin='0s' dur='0.6s' repeatCount='indefinite'></animate></rect><rect x='8' y='7.5' width='4' height='15' fill='#FFF' opacity='0.2'><animate attributeName='opacity' attributeType='XML' values='0.2; 1; .2' begin='0.15s' dur='0.6s' repeatCount='indefinite'></animate><animate attributeName='height' attributeType='XML' values='10; 20; 10' begin='0.15s' dur='0.6s' repeatCount='indefinite'></animate><animate attributeName='y' attributeType='XML' values='10; 5; 10' begin='0.15s' dur='0.6s' repeatCount='indefinite'></animate></rect><rect x='16' y='10' width='4' height='10' fill='#FFF' opacity='0.2'><animate attributeName='opacity' attributeType='XML' values='0.2; 1; .2' begin='0.3s' dur='0.6s' repeatCount='indefinite'></animate><animate attributeName='height' attributeType='XML' values='10; 20; 10' begin='0.3s' dur='0.6s' repeatCount='indefinite'></animate><animate attributeName='y' attributeType='XML' values='10; 5; 10' begin='0.3s' dur='0.6s' repeatCount='indefinite'></animate></rect></svg></div>");
			}				
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
				if (Number(percent)<7){//FACTORY NEW
					var pointerPercent=Number(realfloat.substr(2,4))/7;
					var pointer='<div class="pointer" style="left:calc('+pointerPercent+'% - 2.5px);"><img src="http://i.imgur.com/hA9mRWu.png" width="5px"></div>';
					var floatHtml = '<div class="wear"><div class="fn" style="background-color:#27ae60;width:100%;">'+pointer+'</div><div class="mw" style="background-color:#2ecc71;width:0%;"></div><div class="ft" style="background-color:#f1c40f;width:0%;"></div><div class="ww" style="background-color:#d35400;width:0%;"></div><div class="bs" style="background-color:#c0392b;width:0%;"></div></div>';
				} else if (Number(percent)<15){//MINIMAL WEAR
					var pointerPercent=(Number(realfloat.substr(2,4))-700)/8;
					var pointer='<div class="pointer" style="left:calc('+pointerPercent+'% - 2.5px);"><img src="http://i.imgur.com/hA9mRWu.png" width="5px"></div>';
					var floatHtml = '<div class="wear"><div class="fn" style="background-color:#27ae60;width:0%;"></div><div class="mw" style="background-color:#2ecc71;width:100%;">'+pointer+'</div><div class="ft" style="background-color:#f1c40f;width:0%;"></div><div class="ww" style="background-color:#d35400;width:0%;"></div><div class="bs" style="background-color:#c0392b;width:0%;"></div></div>';
				
				} else if (Number(percent)<38){//FIELD TESTED
					var pointerPercent=(Number(realfloat.substr(2,4))-1500)/23;
					var pointer='<div class="pointer" style="left:calc('+pointerPercent+'% - 2.5px);"><img src="http://i.imgur.com/hA9mRWu.png" width="5px"></div>';
					var floatHtml = '<div class="wear"><div class="fn" style="background-color:#27ae60;width:0%;"></div><div class="mw" style="background-color:#2ecc71;width:0%;"></div><div class="ft" style="background-color:#f1c40f;width:100%;">'+pointer+'</div><div class="ww" style="background-color:#d35400;width:0%;"></div><div class="bs" style="background-color:#c0392b;width:0%;"></div></div>';
				
				} else if (Number(percent)<45){//WELL WORN
					var pointerPercent=(Number(realfloat.substr(2,4))-3800)/7;
					var pointer='<div class="pointer" style="left:calc('+pointerPercent+'% - 2.5px);"><img src="http://i.imgur.com/hA9mRWu.png" width="5px"></div>';
					var floatHtml = '<div class="wear"><div class="fn" style="background-color:#27ae60;width:0%;"></div><div class="mw" style="background-color:#2ecc71;width:0%;"></div><div class="ft" style="background-color:#f1c40f;width:0%;"></div><div class="ww" style="background-color:#d35400;width:100%;">'+pointer+'</div><div class="bs" style="background-color:#c0392b;width:0%;"></div></div>';
				
				} else {//BATTLE SCARRED
					var pointerPercent=(Number(realfloat.substr(2,4))-4500)/55;
					var pointer='<div class="pointer" style="left:calc('+pointerPercent+'% - 2.5px);"><img src="http://i.imgur.com/hA9mRWu.png" width="5px"></div>';
					var floatHtml = '<div class="wear"><div class="fn" style="background-color:#27ae60;width:0%;"></div><div class="mw" style="background-color:#2ecc71;width:0%;"></div><div class="ft" style="background-color:#f1c40f;width:0%;"></div><div class="ww" style="background-color:#d35400;width:0%;"></div><div class="bs" style="background-color:#c0392b;width:100%;">'+pointer+'</div></div>';
				
				}
				if ($('input[name=DisplayFloats]:checked').val()==="percent"){
					var displayFloat = percent+"."+realfloat.substr(4,2)+" %";
				} else {
					var displayFloat = realfloat.substr(0,10);
				}
				$(window.market.window.document).find('#'+param_a).removeClass('inspectLink').html(floatHtml+"<h4 class='wear'>"+displayFloat+"</h4>").parent().parent().attr("data-float",realfloat.substr(2,7));
			});
		}
	},600);
});
