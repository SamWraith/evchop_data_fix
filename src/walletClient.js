require('dotenv').config();
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


async function makeGrpcCallForCheckBalance() {
    const payload = await makeCheckBalancePayload();
    console.log('Payload for checkBalance:', payload);
    return new Promise((resolve, reject) => {
        walletClient.checkBalance(payload, (error, response) => {
            if (error) {
                console.error('Error in checkBalance:', error);
                return reject(error);
            }
            console.log('Balance response:', response);
            resolve(response);
        });
    });
}

async function makeCheckBalancePayload() {
    return {
        "userID": 10697,
        "partnerID": 10001,
        "coinType": [
            "CASH"
        ],
        "isPrivate": false,
        "clientMetaData": {
            "buildVersion": "Sample",
            "clientSource": "TEST"
        }
      }
}

function main() {
    makeGrpcCallForCheckBalance();

}

main(); // Call main when you are ready to connect

module.exports = { walletClient, wallet_proto }; // Export client and proto if needed elsewhere
