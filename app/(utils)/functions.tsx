import crypto from 'crypto';


export function sha256Hash(input: string): Buffer {
    return crypto.createHash('sha256').update(input).digest();
}
export function getHashedName(name: string): Buffer {
    const input = name;
    const str = sha256Hash(input)
    return str
}