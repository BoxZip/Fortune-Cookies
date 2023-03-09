/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
__webpack_require__.r(__webpack_exports__);

let ACCOUNT;
let web3Provider;
let web3;
let FortuneCookie;
let MINT_TOGGLE;
let BGSTYLE;
let cookie_array;



const blockchains = {};

var chainId;
chainId = chainId === undefined ? 80001/*/Polygon Mumbai/*/ : chainId;

function generateButton(textContent, onClick){
    let button = document.createElement('button');
    button.textContent = textContent;
    if(typeof onClick == 'function') button.addEventListener('click', onClick);
    return button;
}

function toggleMintPage(){
    document.body.classList.toggle('showMint');
    MINT_TOGGLE = !MINT_TOGGLE;
    document.getElementById('main_page').classList.toggle('hide');
    document.getElementById('connect').textContent = MINT_TOGGLE ? "◀ Back" : "Mint Now!";
}

async function init(){
    blockchains[137] = {
        chainName: 'Polygon Mainnet',
        chainId: 137,
        nativeCurrency: { name: 'MATIC', decimals: 18, symbol: 'MATIC' },
        rpcUrls: ['https://polygon-rpc.com/']
    };
    blockchains[80001] = {
        chainName: 'Polygon Mumbai',
        chainId: 80001,
        nativeCurrency: { name: 'MATIC', decimals: 18, symbol: 'MATIC' },
        rpcUrls: ['https://rpc-mumbai.maticvigil.com/']
    };
    let connectWallet = generateButton('Connect Wallet', async function(e){
        await ethEnabled();
        if(window.ethereum) toggleMintPage();
        else alert('Mobile Web3 integration coming soon. \n\nOn desktop install Web3 browser extension, like MetaMask.')
    });
    connectWallet.className = connectWallet.id = 'connect';
    document.body.appendChild(connectWallet);

    cookie_array = buildCookieArray('<img src="cookie.svg" width="128px" height="128px" />', 128, 128, 1500, 1000, -1);
    document.getElementById('cookie_array').innerHTML = cookie_array;

    BGSTYLE = document.body.appendChild(document.createElement('style'))

    animateBG();
    //toggleMintPage();
}

function buildCookieArray(img, x, y, xOffset, yOffset, zOffset, spread){
    var html = "";
    spread = typeof spread == 'number' ? spread: 1;
    xOffset = typeof xOffset == 'number' ? xOffset: 1;
    yOffset = typeof yOffset == 'number' ? yOffset: 1;
    zOffset = typeof zOffset == 'number' ? zOffset: 1;
    let c = 0;
    for(var i=1; i<=x; i++){
        for(var j=1; j<=y; j++){
            html += '<img src="cookie.svg" style="translate: '+(xOffset*Math.pow(j, 0.79)*(2/i))+'px '+(yOffset*Math.pow(i, 0.5)*(1/i))+'px; scale: '+(2/i)+' '+(2/i)+' 1; z-index: '+(zOffset*i*j)+';"/>';
            c++;
        }
        html += '</div>';
    }
    return html;
}
let BG = Math.floor(Math.random()*360);
let BGDIR = Math.random() <= 0.5 ? 1 : -1;

let SATMIN = 25;
let SATMAX = 100;
let SATDIR = Math.random() <= 0.5 ? 1 : -1;

let SAT = SATMIN+Math.floor(Math.random()*SATMAX-SATMIN);

let LUMMIN = 55;
let LUMMAX = 95;
let LUMDIR = Math.random() <= 0.5 ? 1 : -1;

let LUM = LUMMIN+Math.floor(Math.random()*LUMMAX-LUMMIN);
function animateBG(){
    BG+=-7;
    SAT+=SATDIR * 2;
    LUM+=LUMDIR * 2.5;
    if(SAT <= SATMIN || SAT >= SATMAX){ SATDIR = -SATDIR; SAT = Math.min(Math.max(SATMIN, SAT), SATMAX); }
    if(LUM <= LUMMIN || LUM >= LUMMAX){ LUMDIR = -LUMDIR; LUM = Math.min(Math.max(LUMMIN, LUM), LUMMAX); }
    (Math.random() <= 0.05) ? BGDIR = -BGDIR : null;
    if(!BGSTYLE) BGSTYLE = document.body.appendChild(document.createElement('style'));
    BGSTYLE.id = 'BGSTYLE';
    BGSTYLE.innerText = ".BG, body, #mint button, .showMint #connect { background-color: hsl("+(BG%360)+", "+SAT+"%, "+LUM+"%); }  #mint h1 { color: hsl("+(BG%360)+", "+SAT+"%, "+LUM+"%); } #main_page { background-color: hsla("+(BG%360)+", "+SAT+"%, "+LUM+"%, 0.92); }";
    setTimeout(animateBG, 1024);
}

const ethEnabled = async () => {
    if (window.ethereum) {
        let accounts = await window.ethereum.request({method: 'eth_requestAccounts'});
        ACCOUNT = accounts[0]
        window.web3 = new Web3(window.ethereum);
        window.ethereum.on('accountsChanged', function (accounts) {
            ACCOUNT = accounts[0];
        });

        await chainSwitchInstall(chainId);

        FortuneCookie = new window.web3.eth.Contract(FortuneCookie_ABI, FortuneCookie_address);
        return true;  
    }  
    return false;
}

async function chainSwitchInstall(chainId){
    if (window.ethereum.networkVersion !== chainId) {
        try {
            await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: window.web3.utils.toHex(chainId) }]
            });
        } catch (err) {
            // This error code indicates that the chain has not been added to MetaMask
            if (err.code === 4902) {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                {
                    chainName: blockchains[chainId].chainName,
                    chainId: blockchains[chainId].chainId,
                    nativeCurrency: blockchains[chainId].nativeCurrency,
                    rpcUrls: blockchains[chainId].rpcUrls
                }
                ]
            });
            }
        }
    }
}

async function generateSVG(tokenID){
    let svg = await FortuneCookie.methods.generateSVG(tokenID).call();
    let image = document.createElement('img');
    image.src = svg;
    image.id = 'FortuneCookie'+tokenID;
    return image;
}

window.addEventListener('load', init);
/******/ })()
;