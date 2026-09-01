// Stable ETF metadata vocabulary shared by the content schema, checker, and
// new-post scaffold. Keep volatile market data out of this module.

export const ETF_METADATA_FIELDS = Object.freeze([
	'ticker',
	'issuer',
	'assetClass',
	'strategy',
	'exposure',
	'leverage',
	'incomeStyle',
]);

export const ETF_METADATA_ALLOWED_VALUES = Object.freeze({
	assetClass: Object.freeze([
		'Equity',
		'Bond',
		'Commodity',
		'Currency',
		'REIT',
		'Multi-Asset',
		'Alternative',
	]),
	strategy: Object.freeze([
		'Index',
		'Equal Weight',
		'Leveraged',
		'Inverse',
		'Physical',
		'Active',
		'Factor',
		'Covered Call',
		'Option Income',
		'Dividend Growth',
		'High Dividend',
		'Defined Outcome',
		'Futures',
		'Single Stock Leveraged',
	]),
	incomeStyle: Object.freeze(['Core', 'Hedge', 'Income', 'Option Income', 'None']),
});

const ETF_TICKER_REGEX = /^[A-Z0-9][A-Z0-9.-]*$/;

export function normalizeEtfMetadataValue(field, value) {
	if (typeof value !== 'string') {
		return '';
	}

	const normalized = value.trim();
	return field === 'ticker' ? normalized.toUpperCase() : normalized;
}

export function getEtfMetadataAllowedValues(field) {
	return ETF_METADATA_ALLOWED_VALUES[field] ?? [];
}

export function isValidEtfMetadataValue(field, value) {
	if (!ETF_METADATA_FIELDS.includes(field) || typeof value !== 'string' || !value.trim()) {
		return false;
	}

	const normalized = normalizeEtfMetadataValue(field, value);
	if (field === 'ticker') {
		return value.trim() === normalized && ETF_TICKER_REGEX.test(normalized);
	}

	if (field === 'issuer' || field === 'exposure' || field === 'leverage') {
		if (field === 'leverage') {
			const leverageMatch = normalized.match(/^-?(\d+(?:\.\d+)?)x$/);
			return leverageMatch !== null && Number(leverageMatch[1]) > 0;
		}
		return true;
	}

	return getEtfMetadataAllowedValues(field).includes(normalized);
}

export function getEtfMetadataValidationMessage(field) {
	if (field === 'ticker') {
		return 'use an uppercase ticker containing only letters, numbers, dots, or hyphens';
	}

	if (field === 'leverage') {
		return 'use a leverage format such as 1x, 3x, or -3x';
	}

	const allowedValues = getEtfMetadataAllowedValues(field);
	return allowedValues.length
		? `use one of: ${allowedValues.join(', ')}`
		: 'use a non-empty string';
}
