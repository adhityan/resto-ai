import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import NodeRSA from 'node-rsa';

export class CryptoUtils {
    /**
     * Returns the MD5 value of the content
     *
     * @param content - This is the content of the document
     *
     * @returns md5 value of the content
     */
    public static getMD5(content: string): string {
        return crypto.createHash('md5').update(content, 'utf8').digest('hex');
    }

    /**
     * Generates and returns the salt
     *
     * @param saltBytesLength - the number of bytes to create for salt
     *
     * @returns salt value
     */
    public static makeSalt(saltBytesLength: number): string {
        return crypto.randomBytes(saltBytesLength).toString('base64');
    }

    /**
     * Generates a secure random token suitable for API keys/secrets
     *
     * @param length - the number of characters in the token
     *
     * @returns URL-safe base64 encoded token
     */
    public static generateSecureToken(length: number): string {
        // Generate enough bytes to ensure the base64 output is at least 'length' characters
        const bytesNeeded = Math.ceil((length * 3) / 4);
        return crypto.randomBytes(bytesNeeded).toString('base64url').slice(0, length);
    }

    /**
     * Encrypts password using bcrypt library
     *
     * @param password - plain text password to be encrypted
     *
     * @returns encrypted password
     */
    public static encryptPassword(
        password: string,
        saltRounds: number
    ): string {
        return bcrypt.hashSync(password, saltRounds);
    }

    /**
     * Compares the password with bcrypt hash
     *
     * @param plainPassword - plain password user entered
     * @param hash - encrypted password using bcrypt algorithm
     *
     * @returns boolean
     */
    public static comparePassword(
        plainPassword: string,
        hash: string
    ): boolean {
        return bcrypt.compareSync(plainPassword, hash);
    }

    /**
     * Encrypts the given message using RSA alogrithm
     *
     * @param message - the message to be encrypted
     * @param key - the key used to encrypt the message
     * @param keyType - Indicates if the service is using the private / public key
     *
     * @returns string
     */
    public static encryptUsingRSA(
        message: string,
        key: string,
        keyType: 'Private' | 'Public'
    ): string {
        const rsa = new NodeRSA(key);

        let encryptedString = '';
        if (keyType === 'Public')
            encryptedString = rsa.encrypt(message, 'utf8');
        else encryptedString = rsa.encryptPrivate(message, 'utf8');

        return encryptedString;
    }

    /**
     * Decrypts the given message using RSA alogrithm
     *
     * @param message - the message to be decrypted
     * @param key - the key used to decrypt the message
     * @param keyType - Indicates if the service is using the private / public key
     *
     * @returns string
     */
    public static decryptUsingRSA(
        message: string,
        key: string,
        keyType: 'Private' | 'Public'
    ): string {
        const rsa = new NodeRSA(key);

        let decryptedString = '';
        if (keyType === 'Public')
            decryptedString = rsa.decrypt(message, 'utf8');
        else decryptedString = rsa.decryptPublic(message, 'utf8');

        return decryptedString;
    }

    /**
     * Decrypts the given message using AES alogrithm
     *
     * @param message - the message to be decrypted
     * @param key - the key used to decrypt the message
     *
     * @returns string
     */
    // public static aesEncryption(message: string, key: string): string {
    //     const keyUtf = cryptoJs.enc.Utf8.parse(key);
    //     const messageUtf = cryptoJs.enc.Base64.parse(message);
    //     const iv = new Array(key.length).join('');

    //     const encrypted = cryptoJs.AES.encrypt(messageUtf, keyUtf, {
    //         iv,
    //         mode: cryptoJs.mode.ECB,
    //         padding: cryptoJs.pad.NoPadding,
    //     });
    //     return cryptoJs.enc.Utf8.stringify(encrypted);
    // }

    /**
     * Decrypts the given message using AES alogrithm
     *
     * @param message - the message to be decrypted
     * @param key - the key used to decrypt the message
     *
     * @returns string
     */
    // public static aesDecryption(message: string, key: string): string {
    //     const keyUtf = cryptoJs.enc.Utf8.parse(key);
    //     const messageUtf = cryptoJs.enc.Base64.parse(message);
    //     const iv = new Array(key.length).join('');

    //     const decoded = cryptoJs.AES.decrypt(messageUtf, keyUtf, {
    //         iv,
    //         mode: cryptoJs.mode.ECB,
    //         padding: cryptoJs.pad.NoPadding,
    //     });
    //     return cryptoJs.enc.Utf8.stringify(decoded);
    // }
}
