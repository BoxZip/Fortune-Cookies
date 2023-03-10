import { AlchemySettings, FortuneCookie_address, FortuneCookie_ABI, chainId } from '../env.js';
import { Alchemy } from 'alchemy-sdk';
import {ethers} from 'ethers';

let NFT = {};
let ACCOUNT;
let FortuneCookieRead;
let FortuneCookieWrite;

window.NFT = NFT;

const $ = new Alchemy({url: AlchemySettings.url});

NFT.connected = false;

NFT.action = 'connect';

NFT.actions = {};

const blockchains = {};
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

async function init(){
    NFT.image = document.getElementById('image');
    NFT.click = document.getElementById('click');
    NFT.label = document.getElementById('label');
    NFT.note = document.getElementById('note');

    NFT.click.addEventListener('click', onClick);

    $.ethersProvider = await $.config.getProvider();
    FortuneCookieRead = new ethers.Contract(FortuneCookie_address, FortuneCookie_ABI, $.ethersProvider);

    NFT.stats = document.createElement('ul');
    NFT.stats.id = "stats";
    
    NFT.addStat = function(id, label, value){
        let stat = document.createElement('li');
        stat.id = id;
        stat.innerHTML = "<b>"+label+'</b> <span class="value">'+value+"</span>";
        NFT.stats.appendChild(stat);
        return stat;
    };
    NFT.setStat = function(id, value){
        document.querySelector('#'+id+' .value').innerHTML = value;
    }

    NFT.addStat('tokenID', 'Token ID', '---');
    NFT.addStat('minted', 'Minted?', '---');
    NFT.addStat('createdAt', 'Created @', '---');
    NFT.addStat('createdBy', 'Created By', '---');
    NFT.addStat('open', 'Open?', '---');
    NFT.addStat('openedAt', 'Opened @', '---');
    NFT.addStat('openedBy', 'Opened By', '---');

    document.body.appendChild(NFT.stats);

    let query = window.location.search;
    if(query.length > 0) query = parseInt(query.slice(1));
    else query = NaN;
    if(isNaN(query)) alert('Invalid TokenID!');
    else{
        NFT.tokenID = query;
        NFT.setStat('tokenID', NFT.tokenID);
        await load();
        update();
    }
}

async function onClick(e){
    if(!NFT.connected) await NFT.actions.connect();
    else if(NFT.connected && NFT.authorized){
        NFT.actions[NFT.action]();
    }
}
NFT.onClick = onClick;

function onNoteClick(e){
    document.body.classList.remove('reveal');
}
async function load(){
    if(typeof NFT.tokenID == 'number'){
        let _tokenID = await FortuneCookieRead.tokenCount();
        if(NFT.tokenID < 0 || NFT.tokenID >= _tokenID) alert('Invalid Token ID');
        else{
            try{
                NFT.token = await FortuneCookieRead.tokens(NFT.tokenID);
                NFT.minted = NFT.token[1];
                NFT.createdAt = NFT.token[2];
                NFT.createdBy = NFT.token[3];
                NFT.open = NFT.token[4];
                NFT.openedAt = NFT.token[5];
                NFT.openedBy = NFT.token[6];
            }catch(e){
                //
            }
            NFT.owner = await FortuneCookieRead.ownerOf(NFT.tokenID);
        }
    }
}

function timestampToString(time){
    const date = new Date(time * 1000);
    const datevalues = [
    date.getFullYear(),
    date.getMonth()+1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds()
    ];
    return datevalues.join('-')
}

async function update(){
    NFT.image.src = NFT.open ? '../cookie-opened.svg' : '../cookie.svg';
    NFT.action = NFT.open ? 'read' : 'open';
    if(NFT.open) document.body.classList.add('opened');
    NFT.setStat('minted', NFT.minted?"Yes":"No");
    if(NFT.minted){
        NFT.setStat('createdAt', timestampToString(NFT.createdAt));
        NFT.setStat('createdBy', NFT.createdBy);
        NFT.setStat('open', NFT.open ? "Yes" : "No");
        if(NFT.open){
            NFT.setStat('openedAt', timestampToString(NFT.openedAt));
            NFT.setStat('openedBy', NFT.openedBy);
        }
    }
    if(typeof NFT.message == 'string'){
        let note = document.createElement('b');
        note.textContent = NFT.message;
        NFT.note.innerHTML = "";
        NFT.note.appendChild(note);
        document.body.classList.add('reveal');
    }
    if(NFT.connected){
        connectedUpdate();
    }
}

async function updateUntilOpened(){
    NFT.open = await FortuneCookieRead.isCookieOpened(NFT.tokenID);
    if(NFT.open){
        NFT.openAt = (new Date()).getTime();
        await update();
        alert('The cookie has been cracked!\nOnce the transaction clears you can read the note inside.')
    }else{
        requestAnimationFrame(function(){ setTimeout(updateUntilOpened, 1000) })
    }
}

function connectedUpdate(){
    NFT.label.innerText = NFT.action.toUpperCase();
    if(!NFT.owner) null;
    else if(sameAddress(NFT.owner,ACCOUNT)){
        document.body.classList.add('owner');
        NFT.authorized = true;
        if(NFT.open && typeof NFT.message !== 'string') read();
    }
    else{
        alert("The wallet you are connected with does not hold this NFT.")
        document.body.classList.add('non-owner');
        NFT.authorized = false;
    }
}

async function connect(){
    if(!confirm("Only the owner of this NFT can interact with this NFT.\nDo you wish to continue?")) return;
    if(await ethEnabled()){
        if(ACCOUNT){
            NFT.connected = true;
            FortuneCookieWrite = new ethers.Contract(FortuneCookie_address, FortuneCookie_ABI, NFT.signer);
            document.body.classList.add('active');
            update();
        }
    }else{
        alert('You need a plugin like MetaMask to enable Web3 interaction.');
    }
    return false;
}

function sameAddress(a,b){
    return a.toLowerCase() == b.toLowerCase();
}

NFT.actions.connect = connect;

async function open(){
    if(!NFT.authorized) alert('You must be the owner of this NFT to interact with it.');

    if(!confirm("Are you sure you want to open this fortune cookie?\n(This action cannot be reversed, but you must open it to be able to read the message inside.)")) return;

    try{
        await FortuneCookieWrite.open(NFT.tokenID);
        updateUntilOpened();
    }catch(e){
        alert('Error: '+e.message);
    }
}
NFT.actions.open = open;

async function read(){
    if(!NFT.authorized) alert('You must own this NFT in order to interact with it!');
    else if(typeof NFT.message == 'string') document.body.classList.add('reveal');
    else if(NFT.openAt){
        if((new Date()).getTime() < NFT.openAt+(5000)) return;
    }
    if(NFT.open){
        try{
            NFT.message = await FortuneCookieWrite.read(NFT.tokenID);
            update();
        }catch(e){
            console.log(e.message);
        }
    }
}
NFT.actions.read = read;

const ethEnabled = async () => {
    if (window.ethereum) {
        NFT.ethersProvider = new ethers.providers.Web3Provider(window.ethereum);
        NFT.signer = NFT.ethersProvider.getSigner();

        let accounts = await window.ethereum.request({method: 'eth_requestAccounts'});
        ACCOUNT = accounts[0];

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


window.addEventListener('load', init);