import bcrypt from "bcrypt";

const SALT_ROUNDS = Number(process.env.PASSWORD_SALT_ROUNDS || 12);

export const hashPassword = async (plain: string) => {
    return bcrypt.hash(plain, SALT_ROUNDS);
};

export const comparePassword = (plain: string, hash: string) => {
    return bcrypt.compare(plain, hash);
};
