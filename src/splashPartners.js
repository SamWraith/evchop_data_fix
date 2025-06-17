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
const splashClient = new wallet_proto.WalletSplashThePot(walletUrl, credentials);

console.log(`Wallet client connected to ${walletUrl} (Transport Security: ${useTransportSecurity})`);

async function makeGrpcCallForSplashPartnerReconciliation(splashPayload) {
    console.log('Payload for splashPartnerReconciliation:', splashPayload);
    return new Promise((resolve, reject) => {
        splashClient.splashShareableCreditReconciliation(splashPayload, (error, response) => {
            if (error) {
                console.error('Error in splashPartnerReconciliation:', error);
                return reject(error);
            }
            console.log('Splash partner reconciliation response:', response);
            resolve(response);
        });
    });
}

async function main() {
    const data = await fsp.readFile(__dirname + "/json/splash_test.json", "utf8");
    const payload = JSON.parse(data);
    let sum = 0;

    for (const item of payload) {
        console.log('Processing item:', item);
        sum = sum + Number(item.amount);
        const payload = (item.payload);
        console.log(payload);
        await makeGrpcCallForSplashPartnerReconciliation(payload);
        console.log('Processed transactionId:', item.transaction_id);
    }
    console.log('All items processed. Total count:', payload.length);
    console.log(`Total credit amount: ${sum}`);
}

main();