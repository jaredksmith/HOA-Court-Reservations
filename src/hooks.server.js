import { getUserFromSession } from '$lib/server/auth';

/** @type {import('@sveltejs/kit').Handle} */
export const handle = async ({ event, resolve }) => {
  // Get the session cookie
  const sessionId = event.cookies.get('session');
  
  // Get the user from the session
  const user = await getUserFromSession(sessionId);
  
  // Add the user to locals so it's accessible in load functions
  event.locals.user = user;
  
  // Resolve the request
  return resolve(event);
};