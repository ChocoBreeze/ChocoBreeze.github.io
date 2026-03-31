export type BlogCategoryKey =
	| 'ETF'
	| 'Economics'
	| 'Semiconductor'
	| 'Computer Science'
	| 'Programming'
	| 'Problem_Solving'
	| 'Reports'
	| 'Market Brief';

export type BlogCategoryDefinition = {
	key: BlogCategoryKey;
	label: string;
	href: string;
	title: string;
	description: string;
	sortOrder: 'asc' | 'desc';
};

export const BLOG_CATEGORIES: BlogCategoryDefinition[] = [
	{
		key: 'ETF',
		label: 'ETF',
		href: '/etf',
		title: 'ETF 알아보기',
		description: 'ETF에 대한 기초 지식부터 다양한 종류와 투자 방법까지 알아봅니다.',
		sortOrder: 'asc',
	},
	{
		key: 'Economics',
		label: 'Economics',
		href: '/economics',
		title: '경제 개념 정리',
		description: '금리, 유동성, 경기 사이클, 환율 같은 경제 흐름의 기본 개념을 정리합니다.',
		sortOrder: 'desc',
	},
	{
		key: 'Semiconductor',
		label: 'Semiconductor',
		href: '/semiconductor',
		title: '왕초보 반도체 뽀개기',
		description: '반도체의 기초부터 최신 기술까지 초등학생도 이해할 수 있게 쉽게 풀어 설명합니다.',
		sortOrder: 'asc',
	},
	{
		key: 'Computer Science',
		label: 'CS',
		href: '/cs',
		title: '전공 지식 창고',
		description: '운영체제, 네트워크, 알고리즘 등 컴퓨터공학의 핵심 이론들을 정리합니다.',
		sortOrder: 'desc',
	},
	{
		key: 'Programming',
		label: 'Programming',
		href: '/programming',
		title: '프로그래밍 기록',
		description: '코드를 통해 배운 것들과 문제 해결 과정을 차곡차곡 기록합니다.',
		sortOrder: 'desc',
	},
	{
		key: 'Problem_Solving',
		label: 'Problem Solving',
		href: '/problem-solving',
		title: 'Problem Solving',
		description: '알고리즘 및 다양한 기술적 문제 해결 기록입니다.',
		sortOrder: 'desc',
	},
	{
		key: 'Reports',
		label: 'AI Research',
		href: '/reports',
		title: 'AI Research Reports',
		description: 'AI와 함께 탐구하고 분석한 다양한 주제별 리포트 기록입니다.',
		sortOrder: 'desc',
	},
	{
		key: 'Market Brief',
		label: 'Market Brief',
		href: '/market-brief',
		title: 'US Market Brief',
		description: '전일과 전주의 미국 주식 시장 흐름을 짧고 선명하게 정리합니다.',
		sortOrder: 'desc',
	},
];

export const FINANCE_CATEGORY_KEYS: BlogCategoryKey[] = ['ETF', 'Reports', 'Market Brief', 'Economics'];
export const COMPUTING_CATEGORY_KEYS: BlogCategoryKey[] = [
	'Computer Science',
	'Programming',
	'Problem_Solving',
];

export function normalizeCategory(category: unknown): string | undefined {
	if (Array.isArray(category)) {
		return typeof category[0] === 'string' ? normalizeCategory(category[0]) : undefined;
	}

	if (typeof category !== 'string') {
		return undefined;
	}

	const normalized = category.trim().toLowerCase();
	if (normalized === 'reports' || normalized === 'report') {
		return 'Reports';
	}
	if (normalized === 'problem_solving' || normalized === 'problem solving') {
		return 'Problem_Solving';
	}
	if (normalized === 'computer science' || normalized === 'cs') {
		return 'Computer Science';
	}
	if (normalized === 'market brief' || normalized === 'market_brief' || normalized === 'us market brief') {
		return 'Market Brief';
	}
	if (normalized === 'semiconductor') {
		return 'Semiconductor';
	}
	if (normalized === 'programming') {
		return 'Programming';
	}
	if (
		normalized === 'economics' ||
		normalized === 'economic' ||
		normalized === 'economy' ||
		normalized === 'macro' ||
		normalized === 'macroeconomics'
	) {
		return 'Economics';
	}
	if (normalized === 'etf') {
		return 'ETF';
	}

	return category;
}

export function getCategoryDefinition(category: unknown) {
	const normalized = normalizeCategory(category);
	return BLOG_CATEGORIES.find(({ key }) => key === normalized);
}
