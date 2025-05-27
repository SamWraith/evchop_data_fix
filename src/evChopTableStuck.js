require('dotenv').config();
const fs = require("fs"); // for createReadStream
const fsp = fs.promises;
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const PROTO_PATH = __dirname + '/proto/wallet.proto'; // Path to your .proto file

const packageDefinition = protoLoader.loadSync(
    PROTO_PATH,
    {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
    });

const wallet_proto = grpc.loadPackageDefinition(packageDefinition).wallet; // Use your package name
const walletUrl = process.env.WALLET_URL || 'localhost:3497';
const useTransportSecurity = process.env.USE_TRANSPORT_SECURITY === 'true';

let credentials;
if (useTransportSecurity) {
    credentials = grpc.credentials.createSsl()
} else {
    credentials = grpc.credentials.createInsecure();
}

const walletClient = new wallet_proto.WalletService(walletUrl, credentials);
const evChopClient = new wallet_proto.WalletEvChop(walletUrl, credentials);

console.log(`Wallet client connected to ${walletUrl} (Transport Security: ${useTransportSecurity})`);

async function makeGrpcCallForEvChopCredit(evChopCreditPayload) {
    console.log('Payload for evChopCredit:', evChopCreditPayload);
    return new Promise((resolve, reject) => {
        evChopClient.evChopCredit(evChopCreditPayload, (error, response) => {
            if (error) {
                console.error('Error in evChopCredit:', error);
                return reject(error);
            }
            console.log('EvChop credit response:', response);
            resolve(response);
        });
    });
}

async function makeEvChopCreditPayload(item) {
    return {
        "handID": item['HAND_ID'],
        "status": "EVCHOP_CREDIT_SUCCESS",
        "revenue": 0,
        "tableID": item['TABLE_ID'],
        "bigBlind": item['BIG_BLIND'],
        "noOfUser": 0,
        "debitAmount": 0,
        "creditAmount": 0,
        "miniGameType": item['GAME_TYPE'],
        "transactionID": item['TRANSACTION_ID'],
        "tournamentType": item['TOURNAMENT_TYPE'],
        "transactionType": "EVCHOP_CREDIT",
        "evChopDebitAmount": {
            "potAfterRake": Number(item['potAfterRake']),
            "splashDropAmount": Number(item['splashDropAmount'])
        },
        "evChopCreditAmount": {
            "evChopFees": 0,
            "remainingPotAfterRake": Number(item['potAfterRake']),
            "remainingSplashDropAmount": Number(item['splashDropAmount'])
        },
        "evChopCreditMetaData": "{\"message\":\"EvChop credit trxn fix\"}"
    }
}

async function main() {
    const data = await fsp.readFile(__dirname + "/json/evChop_table_stuck_till_2025-05-25.json", "utf8");
    const payload = JSON.parse(data);
    let sum = 0;

    for (const item of payload) {
        console.log('Processing item:', item);
        sum = sum + Number(item.potAfterRake) + Number(item.splashDropAmount);
        const evChopCreditPayload = await makeEvChopCreditPayload(item);
        console.log(evChopCreditPayload);
        // await makeGrpcCallForEvChopCredit(evChopCreditPayload);
        console.log('Processed transactionId:', item.TRANSACTION_ID);
    }
    console.log('All items processed. Total count:', payload.length);
    console.log(`Total credit amount: ${sum}`);
}

main();