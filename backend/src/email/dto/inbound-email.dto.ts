import { IsString, IsEmail } from 'class-validator';

export class InboundEmailDto {
  @IsEmail()
  from: string; // The user's email address

  @IsString()
  subject: string; // e.g., "Re: [TCK-1787302609387]"

  @IsString()
  body: string; // The text body of the email
}
