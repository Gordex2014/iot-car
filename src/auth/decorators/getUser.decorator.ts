import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Adds the user to the request object with the usage of a decorator.
 * @example @GetUser() user: User
 * @example @GetUser('email') email: string
 */
export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    if (data) {
      return request.user[data];
    }
    return request.user;
  },
);
