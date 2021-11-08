import {LightningElement, api} from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getRecordNotifyChange } from 'lightning/uiRecordApi';
import SOCKETURL from '@salesforce/label/c.websocketaws_server_url';

/*--------- UTILS ----------------------------------------------------------*/
const showToast = (variant = 'info', mode = 'dismissable', title, message) => {
    return new ShowToastEvent({
        variant: variant,
        mode: mode,
        title: title,
        message: message,
        duration: 5000
    });
};

export default class AWSSocketListener extends LightningElement {
    @api recordId; //record id, used on record edit form or record page
    _socketInitialized = false;
    _socket;
    _recordId;
    WEBSOCKET_SERVER_URL = SOCKETURL;

    /*--------- LIFECYCLE EVENTS ----------------------------------------------------------*/
    renderedCallback() {
        if(!this._socketInitialized){
            this._socketInitialized = true;
            this.initSocket();
        }
    }

    /*--------- SOCKET LISTENER ----------------------------------------------------------*/
    initSocket(){
        // eslint-disable-next-line no-undef
        this._socket = new WebSocket(this.WEBSOCKET_SERVER_URL);
        this._socket.onopen = (e) => {
            console.log('Connection opened!');
            this._socket.send(JSON.stringify({"action":"sendmessage","data":"Mr. Bot joined the party"}));
        }

        this._socket.onmessage = (e) => {
            console.log('Received: ' + e.data);
            this.handleMessage(e.data);
        }

        this._socket.onclose = (e) => {
            this._socket = null;
            console.log('Connection closed!');
        }

        this._socket.onerror = (e) => {
            console.log('Socket error!');
        }
    }

    /*--------- MESSAGE HANDLERS ----------------------------------------------------------*/
    handleMessage(data){
        if(data){
            //EX: SHOW TOAST
            this.dispatchEvent(
                showToast('success','pester','AWS Message Received', data)
            );

            //EX: HANDLE MESSAGE WITH CACHE REFRESH - signal that the data for the provided recordIDs has changed, so that the Lightning Data Service cache and wires are refreshed.
            if(this._recordId && this._recordId !== ''){
                getRecordNotifyChange([{recordId: this._recordId}]);
            }

            //EX: HANDLE MESSAGE WITH BUBBLE EVENT - notifies parent of message data
            const messageEvent = new CustomEvent('messageReceived',{
                detail: {'message':data}
            });
            this.dispatchEvent(messageEvent);
        }
    }
}