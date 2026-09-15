export function getPagefindCategoryValues(categories, normalize = (value) => value) {
	const categoryList = Array.isArray(categories) ? categories : categories ? [categories] : [];

	return [
		...new Set(
			categoryList
				.map((category) => normalize(category))
				.filter((category) => typeof category === 'string' && category.length > 0),
		),
	];
}
