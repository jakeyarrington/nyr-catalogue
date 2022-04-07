/*
 * NYR@ 4
 */

const is_ios_safari = (() => {
var userAgent = window.navigator.userAgent.toLowerCase();
return /iphone|ipad|ipod|macintosh/.test(userAgent) && navigator.vendor && navigator.vendor.indexOf('Apple') > -1 &&
    navigator.userAgent &&
    navigator.userAgent.indexOf('CriOS') === -1 &&
    navigator.userAgent.indexOf('FxiOS') === -1;
})();

var basket_sidebar, favourites_sidebar, options_modal, appController;
const is_local = location.href.indexOf('192.168') > -1 || location.href.indexOf('localhost') > -1;
const api_url = 'https://app.nyrcatalogue.com/wp-json/app/v1/';
const cdn_url = is_local || location.href.indexOf('vibrant-edison') > -1 ? 'https://app.nyrcatalogue.com/data' : '/app/data';
const base_url = location.protocol + '//' + location.host;
const default_welcome_message = 'Hello. Welcome to my catalogue. I hope you enjoy viewing our range of amazing products. Please do let me know if you need any help or advice. I\'d be happy to make any recommendations. Feel free to contact me using any of the options available in the contact panel.';
const params = new URLSearchParams(location.search);

window.deferredPrompt;
function install_app() {
    // M.Toast.dismissAll();
    if(is_ios_safari) {
        M.Modal.getInstance($('#install_app_ios')).open();
    } else {
        window.deferredPrompt.prompt();
        outcome= deferredPrompt.userChoice;  
    }
    
}

if(window.matchMedia('(display-mode: standalone)').matches) {  
    gtag('event', 'pwa-view', {'method': 'PWA', 'agent': window.navigator.userAgent});
}

if(document.referrer.indexOf('configure.nyrcatalogue.com') > -1) {
    console.info('Clearing Service Workers to reset Configurator..');
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) {
            registration.unregister();
        } 
    });
}