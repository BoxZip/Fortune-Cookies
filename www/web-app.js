
let ACCOUNT;
let FortuneCookieRead;
let FortuneCookieWrite;
let ethersProvider;
let ethersSigner;
let MINT_TOGGLE;
let BGSTYLE;
let cookie_array_HTML;
let CONTRACT = {};
let $;
let WALLET = {};

import { Network, Alchemy, AlchemySubscription } from 'alchemy-sdk';
import {ethers} from 'ethers';
import {Howl, Howler} from 'howler';
import { chainId, AlchemySettings, FortuneCookie_address, FortuneCookie_ABI } from './env.js';
/*/
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();
audioContext.pause();
/*/
let crunch;
window.crunch = crunch;

window.ethers = ethers;
window.Alchemy = Alchemy;

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


function playCrunchNoise(){
    //audioContext.resume();
    if(!crunch){
        window.crunch = crunch = new Howl( { src: ['/assets/crunch.wav', '/assets/crunch.ogg'], autoplay: false, volume: 1, onplayerror : function(id, error) { console.log(error); } });
    }
    crunch.play();
}

async function init(){
    setVH();
    blockchains[137] = {
        chainName: 'Polygon Mainnet',
        chainId: 137,
        network: Network.MATIC_MAINNET,
        nativeCurrency: { name: 'MATIC', decimals: 18, symbol: 'MATIC' },
        rpcUrls: ['https://polygon-rpc.com/']
    };
    blockchains[80001] = {
        chainName: 'Polygon Mumbai',
        chainId: 80001,
        network: Network.MATIC_MUMBAI,
        nativeCurrency: { name: 'MATIC', decimals: 18, symbol: 'MATIC' },
        rpcUrls: ['https://rpc-mumbai.maticvigil.com/']
    };

    let config = {};
    config.apiKey = AlchemySettings.apiKey;
    config.network = blockchains[chainId].network;

    $ = new Alchemy(config);

    document.getElementById('connectwallet').addEventListener('click', ethEnabled);

    document.getElementById('standard_mint').addEventListener('click', mintStandard);
    document.getElementById('custom_mint').addEventListener('click', mintCustom);

    
    document.getElementById('sendcancel').addEventListener('click', modalCloser('sendmodal'));
    document.getElementById('burncancel').addEventListener('click', modalCloser('burnmodal'));
    //document.getElementById('viewcancel').addEventListener('click', modalCloser('viewmodal'));
    document.getElementById('send').addEventListener('click', transferToken);
    document.getElementById('burn').addEventListener('click', burnToken);
    

    let cookie_array = document.getElementById('cookie_array');

    var openCookie = function(e){ if(e.target.tagName.toUpperCase() == 'IMG'){ if(e.target.src.split('/').slice(-1)[0] == 'cookie.svg') playCrunchNoise(); e.target.src = '/assets/cookie-opened.svg'; } };

    if(window.outerWidth > 749) {
        cookie_array_HTML = buildCookieArray('<img src="/assets/cookie.svg" width="256px" height="256px" />', 32, 32, 2000, 2000, -1);
        cookie_array.innerHTML = cookie_array_HTML;
    }
    [].slice.call(cookie_array.childNodes).forEach((node)=>node.addEventListener('click', openCookie));

    BGSTYLE = document.body.appendChild(document.createElement('style'))

    $.ethersProvider = await $.config.getProvider();

    FortuneCookieRead = new ethers.Contract(FortuneCookie_address, FortuneCookie_ABI, $.ethersProvider);

    animateBG();

    await updatePageValues();
    stayUpdated();
    //toggleMintPage();
}

function weiToEther(wei){
    return parseInt(wei) / Math.pow(10, 18);
}

async function stayUpdated(){
    await updateDynamicValues();
    requestAnimationFrame(function(){
        setTimeout(stayUpdated, 2345);
    });
}

async function updateDynamicValues(){
    let mintPaused = await FortuneCookieRead.pausedMint();
    CONTRACT.mintPaused = mintPaused;
    [].slice.call(document.querySelectorAll('.mintstatus')).forEach(async function(el){
        el.innerText = mintPaused? 'paused' : 'live';
    });
    let tokenCount = await FortuneCookieRead.tokenCount();
    CONTRACT.tokenCount = tokenCount;
    [].slice.call(document.querySelectorAll('.tokencount')).forEach(async function(el){
        el.innerText = tokenCount;
    });
    let totalOpened = await FortuneCookieRead.totalOpened();
    CONTRACT.totalOpened = totalOpened;
    [].slice.call(document.querySelectorAll('.openedcount')).forEach(async function(el){
        el.innerText = totalOpened;
    });
}

async function updatePageValues(){
    let maxquantity = await FortuneCookieRead.maxMintQuantity();
    CONTRACT.maxQuantity = maxquantity;
    document.getElementById('standard_quantity').max = maxquantity;
    document.getElementById('custom_quantity').max = maxquantity;
    [].slice.call(document.querySelectorAll('.maxquantity')).forEach(async function(el){
        el.innerText = maxquantity;
    });
    let maxMessageLength = await FortuneCookieRead.maxMessageLength();
    CONTRACT.maxMessageLength = maxMessageLength;
    document.getElementById('customMSG').maxlength = maxMessageLength;
    [].slice.call(document.querySelectorAll('.maxmessagelength')).forEach(async function(el){
        el.innerText = maxMessageLength;
    });
    let totalSupply = await FortuneCookieRead._totalSupply();
    CONTRACT.totalSupply = totalSupply;
    [].slice.call(document.querySelectorAll('.totalsupply')).forEach(async function(el){
        el.innerText = totalSupply;
    });

    let priceCustom = await FortuneCookieRead.priceCustom();
    CONTRACT.priceCustom = priceCustom;
    [].slice.call(document.querySelectorAll('.customprice')).forEach(async function(el){
        el.innerText = weiToEther(priceCustom) + ' MATIC';
    });
    let priceStandard = await FortuneCookieRead.priceStandard();
    CONTRACT.priceStandard = priceStandard;
    [].slice.call(document.querySelectorAll('.standardprice')).forEach(async function(el){
        el.innerText = weiToEther(priceStandard) + ' MATIC';
    });

    updateDynamicValues();
}

async function getGasPrice() {
    let feeData = (await ethersProvider.getGasPrice()).toNumber();
    let feeMultiplier = 1.5;
    return Math.floor(feeData * feeMultiplier).toString();
}

async function getNonce(address) {
    let nonce = await ethersProvider.getTransactionCount(address)
    return nonce.toString();
}

async function mintStandard(){
    if(CONTRACT.mintPaused) return alert('Minting is currently paused.');
    if(!ACCOUNT) await ethEnabled();
    if(!ACCOUNT) return alert('You must be connected with MetaMask to proceed.')
    if((await ethersProvider.getNetwork()).chainId !== chainId) return alert("Please switch to your MetaMask to use the Polygon Network and try again.")

    let quantity = parseInt(document.getElementById('standard_quantity').value);
    if(quantity<1) return alert('Quantity must be atleast 1');
    if(quantity>CONTRACT.maxQuantity) return alert('Quantity must be '+CONTRACT.maxQuantity+' or less');

    try{
        let gasFee = await getGasPrice();
        let nonce = await getNonce(ACCOUNT);
        let config = {
            value: (CONTRACT.priceStandard * quantity)+"",
            gasPrice: gasFee, 
            nonce: nonce
        }
        let receipt = await FortuneCookieWrite.mint(quantity, config);
        console.log(receipt);
        alert('Transaction successful!');
    }catch(err){
        alert('There was an error while your transaction was being processed:\n\n'+(err.data||err).message);
        console.log(err);
    }
}

async function mintCustom(){
    if(CONTRACT.mintPaused) return alert('Minting is currently paused.');
    if(!ACCOUNT) await ethEnabled();
    if(!ACCOUNT) return alert('You must be connected with MetaMask to proceed.')
    if((await ethersProvider.getNetwork()).chainId !== chainId) return alert("Please switch to your MetaMask to use the Polygon Network and try again.")

    let quantity = parseInt(document.getElementById('custom_quantity').value);
    if(quantity<1) return alert('Quantity must be atleast 1');
    if(quantity>CONTRACT.maxQuantity) return alert('Quantity must be '+CONTRACT.maxQuantity+' or less');

    let message = document.getElementById('customMSG').value;
    if(message.length > CONTRACT.maxMessageLength) return alert('Message length must not exceed '+CONTRACT.maxMessageLength+' characters')
    if(message.split(/[ ]+/).join('').length == 0) return alert('The message is blank')
    
    try{
        let gasFee = await getGasPrice();
        let nonce = await getNonce(ACCOUNT);
        let config = {
            value: (CONTRACT.priceStandard * quantity)+"",
            gasPrice: gasFee, 
            nonce: nonce
        }
        let receipt = await FortuneCookieWrite.mintCustom(quantity, message, config);
        console.log(receipt);
        alert('Transaction pending.\nPlease wait for your transaction to be verified on the blockchain...');
    }catch(err){
        alert('There was an error while your transaction was being processed:\n\n'+(err.data||err).message);
        console.log(err);
    }
}



function buildCookieArray(img, x, y, xOffset, yOffset, zOffset, spread){
    var html = "";
    spread = typeof spread == 'number' ? spread: 1;
    xOffset = typeof xOffset == 'number' ? xOffset: 1;
    yOffset = typeof yOffset == 'number' ? yOffset: 1;
    zOffset = typeof zOffset == 'number' ? zOffset: 1;

    let xAll = -512;
    let yAll = -256-128;
    let c = 0;
    for(var i=1; i<=x; i++){
        for(var j=1; j<=y; j++){
            html += '<img src="/assets/cookie.svg" style="translate: '+((xOffset*Math.pow(j, 0.79)*(2/i))+xAll)+'px '+((yOffset*Math.pow(i, 0.5)*(1/i))+yAll)+'px; scale: '+(2/i)+' '+(2/i)+' 1; z-index: '+(zOffset*i*j)+';"/>';
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
    let values = Math.abs(BG%360)+", "+100+"%, "+50+"%";
    BGSTYLE.innerText = ".BG, body, #mint button, .showMint #connect, #send { transition: background-color 2.97s; background-color: hsla("+values+",0.5); }  h1 { transition: color 2.97s; color: hsl("+values+"); } #contract b, #main_page b, #main_page u, #main_page i{ transition: background-color 2.97s, color 2.97s; background-color: hsla("+values+", 0.15); color: hsla("+values+", 1); } #wallet { transition: border-color 2.97s; border-color: hsla("+values+", 1); }";
    requestAnimationFrame(function(){ setTimeout(animateBG, 3000) });
}

let listeners = [];
async function onConnect(){
    document.body.classList.add('connected');
    if(listeners.indexOf(ACCOUNT.toLowerCase()) == -1){
        $.ws.on({
            method: 'alchemy_minedTransactions',
            addresses: [{"to": FortuneCookie_address, "from": ACCOUNT}]
        }, handleTransactionResponse );
        
        listeners.push(ACCOUNT.toLowerCase());
    }
    loadWallet();
}

async function loadWallet(){
    let balance = await FortuneCookieRead.balanceOf(ACCOUNT);
    WALLET = {};
    showWalletNFTs();
    if(balance > 0){
        let tokenID, NFT;
        for(let i=0; i<balance; i++){
            loadOwnerNFT(ACCOUNT, i);
        }
    }
}

async function loadOwnerNFT(owner, i){
    var tokenID = await FortuneCookieRead.tokenOfOwnerByIndex(owner, i);
    var NFT = {};
    NFT.token = await FortuneCookieRead.tokens(tokenID);
    NFT.minted = NFT.token[1];
    NFT.owner = owner;
    NFT.tokenID = tokenID;
    NFT.createdAt = NFT.token[2];
    NFT.createdBy = NFT.token[3];
    NFT.open = NFT.token[4];
    NFT.openedAt = NFT.token[5];
    NFT.openedBy = NFT.token[6];
    NFT.element = buildNFT(NFT);
    WALLET[tokenID] = NFT;
    showWalletNFTs();
    return NFT;
}

function showWalletNFTs(){
    let wallet = document.querySelector('#wallet .container');
    let connectwallet = document.getElementById('connectwallet');
    wallet.innerHTML = ""
    wallet.appendChild(connectwallet);
    Object.keys(WALLET).map(v=>parseInt(v)).sort((a,b)=>a-b).forEach(NFT => { wallet.appendChild(WALLET[NFT].element); })
}

function buildNFT(NFT){
    let element = document.createElement('div');
    element.className = 'token';
    let img = document.createElement('img');
    img.src = NFT.open ? '/assets/cookie-opened.svg' : '/assets/cookie.svg';
    element.appendChild(img);
    let tokenID = document.createElement('b');
    tokenID.textContent = '#'+NFT.tokenID;
    element.appendChild(tokenID);
    
    let menu = document.createElement('div');
    menu.className = 'menu';
    let sendBtn = generateButton('Send', function(e){
        openSendModal(NFT);
    });
    sendBtn.classList.add('send');
    menu.appendChild(sendBtn);
    let viewBtn = generateButton('View', function(e){
        openViewModal(NFT);
    });
    menu.appendChild(viewBtn);
    let burnBtn = generateButton('Burn', function(e){
        openBurnModal(NFT);
    });
    burnBtn.classList.add('burn');
    menu.appendChild(burnBtn);
    
    element.appendChild(menu);

    return element;
}

function openSendModal(NFT){
    let sendTokenID = document.getElementById('sendTokenID');
    sendTokenID.value = NFT.tokenID;
    document.getElementById('sendFrom').value = NFT.owner;
    document.getElementById('sendcookie').src = NFT.open ? '/assets/cookie-opened.svg' : '/assets/cookie.svg';
    modalOpener('sendmodal')();
}

function openViewModal(NFT){
    window.location = '/NFT?'+NFT.tokenID;
    /*/
    document.getElementById('viewTokenID').textContent = NFT.tokenID;
    document.getElementById('viewcookie').src = NFT.open ? '/assets/cookie-opened.svg' : '/assets/cookie.svg';
    modalOpener('viewmodal')();
    /*/
}

function modalCloser(modalId){
    return function(){
        document.getElementById(modalId).classList.remove('show');
    }
}

function closeAllModals(){
    document.getElementById('burnmodal').classList.remove('show');
    document.getElementById('sendmodal').classList.remove('show');
    document.getElementById('viewmodal').classList.remove('show');
}

function modalOpener(modalId){
    return function(){
        closeAllModals();
        document.getElementById(modalId).classList.add('show');
    }
}

function openBurnModal(NFT){
    let burnTokenID = document.getElementById('burnTokenID');
    burnTokenID.value = NFT.tokenID;
    document.getElementById('burncookie').src = NFT.open ? '/assets/cookie-opened.svg' : '/assets/cookie.svg';
    modalOpener('burnmodal')();
}

async function transferToken(){
    let tokenID = parseInt(document.getElementById('sendTokenID').value);
    let sendTo = document.getElementById('sendTo').value;
    let sendFrom = document.getElementById('sendFrom').value;
    let NFT = WALLET[tokenID];
    if(!NFT) return alert('UNKNOWN TOKEN ID');
    if(!sameAddress(sendFrom, ACCOUNT)) return alert('Please connect to '+sendFrom+' on MetaMask first.');
    if(FortuneCookieWrite === null) await switchToPolygon();
    if(FortuneCookieWrite === null) return alert('You must connect to Polygon Mainnet on MetaMask to send this NFT.')
    if(confirm('Are you sure you would like to send token #'+tokenID+' from '+sendFrom+' to '+sendTo+' ?')){
        try{
            let gasFee = await getGasPrice();
            let nonce = await getNonce(ACCOUNT);
            let config = {
                gasPrice: gasFee, 
                nonce: nonce
            }
            let receipt = await FortuneCookieWrite.transferFrom(sendFrom, sendTo, tokenID.toString(), config);
            console.log(receipt);
        }catch(err){
            alert('There was an error while your transaction was being processed:\n\n'+(err.data||err).message);
            console.log(err);
        }
    }
}

function sameAddress(a,b){
    return a.toString().toLowerCase() == b.toString().toLowerCase();
}

async function burnToken(){
    let tokenID = parseInt(document.getElementById('burnTokenID').value);
    let NFT = WALLET[tokenID];
    if(!NFT) return alert('UNKNOWN TOKEN ID');
    if(!sameAddress(NFT.owner, ACCOUNT)) return alert('Please connect to '+NFT.owner+' on MetaMask first.');
    if(FortuneCookieWrite === null) await switchToPolygon();
    if(FortuneCookieWrite === null) return alert('You must connect to Polygon Mainnet on MetaMask to burn this NFT.')
    if(confirm('Are you sure you would like to PERMANENTLY DESTROY Fortune Cookie #'+tokenID+' ?')){
        try{
            let gasFee = await getGasPrice();
            let nonce = await getNonce(ACCOUNT);
            let config = {
                gasPrice: gasFee, 
                nonce: nonce
            }
            let receipt = await FortuneCookieWrite.burn(tokenID.toString(), config);
            console.log(receipt);
        }catch(err){
            alert('There was an error while your transaction was being processed:\n\n'+(err.data||err).message);
            console.log(err);
        }
    }
}

function handleTransactionResponse(txn){
    loadWallet();
    if(txn.removed){
        alert('Transaction reverted. \nCheck etherscan for more information.');
    }else{
        alert('Transaction confirmed!')
    }
    closeAllModals();
}

async function updateProvider(){
    ethersProvider = new ethers.providers.Web3Provider(window.ethereum);
    ethersSigner = ethersProvider.getSigner();
    if((await ethersProvider.getNetwork()).chainId == chainId) FortuneCookieWrite = new ethers.Contract(FortuneCookie_address, FortuneCookie_ABI, ethersSigner);
    else FortuneCookieWrite = null;
}

const ethEnabled = async () => {
    if (window.ethereum) {
        await chainSwitchInstall(chainId);

        let accounts = await window.ethereum.request({method: 'eth_requestAccounts'});
        ACCOUNT = accounts[0]
        
        window.ethereum.on('accountsChanged', async function (accounts) {
            ACCOUNT = accounts[0];
            await updateProvider();
            onConnect();
        });

        await updateProvider();

        if(ACCOUNT) onConnect();
        return true;  
    }  
    return false;
}

async function switchToPolygon(){
    await chainSwitchInstall(chainId);
    await updateProvider();
}

async function chainSwitchInstall(chainId){
    if (window.ethereum.networkVersion !== chainId) {
        try {
            await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x'+(chainId).toString(16) }]
            });
        } catch (err) {
            // This error code indicates that the chain has not been added to MetaMask
            if (err.code === 4902) {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                {
                    chainName: blockchains[chainId].chainName,
                    chainId: '0x'+(chainId).toString(16),
                    nativeCurrency: blockchains[chainId].nativeCurrency,
                    rpcUrls: blockchains[chainId].rpcUrls
                }
                ]
            });
            }
        }
    }
}

window.addEventListener('load', init);
let setVH = () => {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
};
setVH();
window.addEventListener('resize', setVH);