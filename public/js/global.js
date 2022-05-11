const body = $("body");
const header = $("header");

body.on('click', (e) => {
    if(e.target.parentNode.className == "phone_menu_button")
    return;

    let phoneMenu = $(header).find(".phone_menu_navigation");
    let style = phoneMenu[0].style;
    style.display = "";
});

// Mobile header dropdown
header.find(".phone_menu_button").on('click', (e) => {
    let phoneMenu = $(header).find(".phone_menu_navigation");
    let style = phoneMenu[0].style;
    let deploy = style.display == "";

    if(deploy) style.display = "block";
    
    $(phoneMenu).css('-webkit-animation', `${deploy ? "deploy" : "retract"}Animation 500ms ease-in-out forwards`);
    $(phoneMenu).bind('webkitAnimationEnd', () => style.display = deploy ? "block" : "");
});


const bigAccountButton = header.find(".big-account-button");
bigAccountButton.on('click', (e) => {
   let dropdown = bigAccountButton.find(".big-header-dropdown");
   let style = dropdown[0].style;
   let deploy = style.display == "";
  
   if(deploy) style.display = "block";

   $(dropdown).css('-webkit-animation', `${deploy ? "deploy" : "retract"}Animation 500ms ease-in-out forwards`);
   $(dropdown).bind('webkitAnimationEnd', () => style.display = deploy ? "block" : "");
});