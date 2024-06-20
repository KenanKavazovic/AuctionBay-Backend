import { IsEmail, IsOptional, Matches, ValidateIf } from 'class-validator'
import { Match } from '../../../decorators/match.decorator'

export class UpdateUserDto {
  @IsOptional()
  firstName?: string

  @IsOptional()
  lastName?: string

  @IsEmail()
  @IsOptional()
  email?: string
  
  @IsOptional()
  refreshToken?: string | null

  @ValidateIf((o) => typeof o.current_password === 'string' && o.current_password.length > 0)
  @IsOptional()
  current_password?: string

  @ValidateIf((o) => typeof o.password === 'string' && o.password.length > 0)
  @Matches(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{6,}$/, {
    message:
      'Password must have at least one number, lower and upper case letter and it has to be longer than 5 characters.',
  })
  @IsOptional()
  password?: string

  @ValidateIf((o) => typeof o.confirm_password === 'string' && o.confirm_password.length > 0)
  @Match(UpdateUserDto, (s) => s.password, { message: 'Passwords do not match.' })
  @IsOptional()
  confirm_password?: string
}