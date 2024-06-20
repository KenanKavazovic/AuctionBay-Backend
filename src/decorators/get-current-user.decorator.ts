import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { User } from '@prisma/client'

export const GetCurrentUser = createParamDecorator((_, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest()
  return request.user as User
})
