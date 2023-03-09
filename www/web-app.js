
let ACCOUNT;
let web3Provider;
let web3;
let FortuneCookie;
let MINT_TOGGLE;
let BGSTYLE;
let cookie_array_HTML;

import { Network, Alchemy } from 'alchemy-sdk';
import {ethers} from 'ethers';
import { chainId, AlchemySettings, FortuneCookie_address, FortuneCookie_ABI } from './env.js';

window.ethers = ethers;
window.Alchemy = Alchemy;

const $ = new Alchemy(AlchemySettings);

const blockchains = {};

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
    let connectWallet = generateButton('Mint Now!', async function(e){
        toggleMintPage();
        await ethEnabled();
    });
    connectWallet.className = connectWallet.id = 'connect';
    document.body.appendChild(connectWallet);


    let cookie_array = document.getElementById('cookie_array');

    var openCookie = function(e){ console.log(e.target); if(e.target.tagName.toUpperCase() == 'IMG') e.target.src = 'cookie-opened.svg'; };

    if(window.outerWidth > 749) {
        cookie_array_HTML = buildCookieArray('<img src="cookie.svg" width="256px" height="256px" />', 64, 64, 2000, 2000, -1);
        cookie_array.innerHTML = cookie_array_HTML;
    }
    [].slice.call(cookie_array.childNodes).forEach((node)=>node.addEventListener('click', openCookie));

    BGSTYLE = document.body.appendChild(document.createElement('style'))

    $.ethersProvider = await $.config.getProvider();

    window.FC = FortuneCookie = new ethers.Contract(FortuneCookie_address, FortuneCookie_ABI, $.ethersProvider);

    animateBG();

    updatePageValues();
    //toggleMintPage();
}

function weiToEther(wei){
    return parseInt(wei) / Math.pow(10, 18);
}

async function updatePageValues(){
    let maxquantity = await FortuneCookie.maxMintQuantity();
    document.getElementById('standard_quantity').max = maxquantity;
    document.getElementById('custom_quantity').max = maxquantity;
    [].slice.call(document.querySelectorAll('.maxquantity')).forEach(async function(el){
        el.innerText = maxquantity;
    });
    let maxMessageLength = await FortuneCookie.maxMessageLength();
    document.getElementById('customMSG').maxlength = maxMessageLength;
    [].slice.call(document.querySelectorAll('.maxmessagelength')).forEach(async function(el){
        el.innerText = maxMessageLength;
    });
    let totalSupply = await FortuneCookie._totalSupply();
    [].slice.call(document.querySelectorAll('.totalsupply')).forEach(async function(el){
        el.innerText = totalSupply;
    });
    /*/
    /// Leave prices to reflect production cost rather than development
    ///
    let priceCustom = await FortuneCookie.priceCustom();
    [].slice.call(document.querySelectorAll('.customprice')).forEach(async function(el){
        el.innerText = weiToEther(priceCustom) + ' MATIC';
    });
    let priceStandard = await FortuneCookie.priceStandard();
    [].slice.call(document.querySelectorAll('.standardprice')).forEach(async function(el){
        el.innerText = weiToEther(priceStandard) + ' MATIC';
    });
    /*/
    let tokenCount = await FortuneCookie.tokenCount();
    [].slice.call(document.querySelectorAll('.tokencount')).forEach(async function(el){
        el.innerText = tokenCount;
    });
    /*/
    let totalOpened = await FortuneCookie.totalOpened();
    [].slice.call(document.querySelectorAll('.openedcount')).forEach(async function(el){
        el.innerText = totalOpened;
    });
    /*/
    let mintPaused = await FortuneCookie.pausedMint();
    [].slice.call(document.querySelectorAll('.mintstatus')).forEach(async function(el){
        el.innerText = mintPaused? 'paused' : 'live';
    });
}

function buildCookieArray(img, x, y, xOffset, yOffset, zOffset, spread){
    var html = "";
    spread = typeof spread == 'number' ? spread: 1;
    xOffset = typeof xOffset == 'number' ? xOffset: 1;
    yOffset = typeof yOffset == 'number' ? yOffset: 1;
    zOffset = typeof zOffset == 'number' ? zOffset: 1;

    let xAll = -512;
    let yAll = -256;
    let c = 0;
    for(var i=1; i<=x; i++){
        for(var j=1; j<=y; j++){
            html += '<img src="cookie.svg" style="translate: '+((xOffset*Math.pow(j, 0.79)*(2/i))+xAll)+'px '+((yOffset*Math.pow(i, 0.5)*(1/i))+yAll)+'px; scale: '+(2/i)+' '+(2/i)+' 1; z-index: '+(zOffset*i*j)+';"/>';
            c++;
        }
        html += '</div>';
    }
    return html;
}
let BG = 120;
let BGDIR = Math.random() <= 0.5 ? 1 : -1;

let SATMIN = 25;
let SATMAX = 100;
let SATDIR = Math.random() <= 0.5 ? 1 : -1;

let SAT = SATMIN+Math.floor(Math.random()*SATMAX-SATMIN);

let LUMMIN = 40;
let LUMMAX = 60;
let LUMDIR = Math.random() <= 0.5 ? 1 : -1;

let LUM = LUMMIN+Math.floor(Math.random()*LUMMAX-LUMMIN);
function animateBG(){
    let R = (Math.random()*20)-9.7;
    BG+=-7*R;
    SAT+=SATDIR * 2*R;
    LUM+=LUMDIR * 0.25*R;
    if(SAT <= SATMIN || SAT >= SATMAX){ SATDIR = -SATDIR; SAT = Math.min(Math.max(SATMIN, SAT), SATMAX); }
    if(LUM <= LUMMIN || LUM >= LUMMAX){ LUMDIR = -LUMDIR; LUM = Math.min(Math.max(LUMMIN, LUM), LUMMAX); }
    (Math.random() <= 0.05) ? BGDIR = -BGDIR : null;
    if(!BGSTYLE) BGSTYLE = document.body.appendChild(document.createElement('style'));
    BGSTYLE.id = 'BGSTYLE';
    let values = Math.abs(BG%360)+", "+25+"%, "+LUM+"%";
    BGSTYLE.innerText = ".BG, body, #mint button, .showMint #connect { background-color: hsl("+values+"); }  #mint h1 { color: hsl("+values+"); } #main_page { color: hsla("+values+", 0.92); }";
    requestAnimationFrame(function(){ setTimeout(animateBG, 3000) });
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