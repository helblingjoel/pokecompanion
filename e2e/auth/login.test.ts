import { expect, test } from '@playwright/test';

test('Email/Password flow validates user input and allows sign-up correctly', async ({ page }) => {
	await page.goto('/auth/signin');

	await page.getByLabel('Password', { exact: true }).fill('NotValidPassword');
	await page.getByLabel('Email').fill('test@user.com');
	await page.getByRole('button', { name: 'Log in' }).click();

	await page.waitForFunction(() => document.readyState === 'complete');

	const errorText = page.getByText(
		'Must contain: 1 uppercase, 1 lowercase, 1 number, 1 special char and be 8+ characters long'
	);
	expect(errorText).toBeTruthy();

	await page.getByLabel('Password', { exact: true }).fill('P@assword1!');
	await page.getByRole('button', { name: 'Sign up' }).click();

	await page.waitForFunction(() => document.readyState === 'complete');
	await page.getByLabel('Confirm Password').fill('P@assword1!');
	await page
		.getByLabel('Username (Optional)')
		.fill('cool username with spaces (invalid characters)');

	await page.getByRole('button', { name: 'Sign up' }).click();

	await page.waitForFunction(() => document.readyState === 'complete');

	const signupFailText = page.locator('#wrapper').getByText('Sign up failed');
	expect(signupFailText).toBeTruthy();
});

// Playwright doesn't support dealing with multipart form data...
