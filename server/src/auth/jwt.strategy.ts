import { InjectModel } from "@nestjs/mongoose";
import { PassportStrategy } from "@nestjs/passport";
import { User, UserDocument } from "../users/user.schema";
import { ExtractJwt, Strategy } from "passport-jwt";
import { UnauthorizedException } from "@nestjs/common/exceptions/unauthorized.exception";
import { JwtPayload } from "jsonwebtoken";
import { Model } from "mongoose";

export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    ) {
        super(
            {
                jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
                ignoreExpiration: false,
                secretOrKey: process.env.JWT_SECRET,
            }
        );
    }
      async validate(payload: JwtPayload){
            const { email } = payload;
            const user = await this.userModel.findOne({ email }).exec();
            if (!user) {
                throw new UnauthorizedException();
            }
            return user;
        }
}