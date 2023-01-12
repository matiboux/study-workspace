import fs from 'fs'

import katex from 'katex'

const argFiles = process.argv.slice(2)
if (argFiles.length > 0)
{
	for (const file of argFiles)
	{
		processPath(file)
	}
}
else
{
	processPath('.')
}

async function processPath(path)
{
	const pathStats = await fs.promises.stat(path)
	if (pathStats.isDirectory())
	{
		const dirFiles = await fs.promises.readdir(path)
		for (const file of dirFiles)
		{
			processPath(`${path}/${file}`)
		}
	}
	else if (pathStats.isFile() && path.endsWith('.md'))
	{
		processFile(path)
	}
}

async function processFile(path)
{
	console.log(path)
	let content = await fs.promises.readFile(path, 'utf8')

	// Save escaped dollar characters
	content = content.replace(/\\\$/gs, '\\&!#36;')

	// Save escaped grave accent characters
	content = content.replace(/\\`/gs, '\\&!#96;')

	// Escape dollar characters in code blocks
	content = content.replace(/```.+?```(?=\s|$)/gs,
		match => match.replace(/\$/g, '&!#36;'))
	content = content.replace(/(?<!`)`(?!`)[^\n]+?(?<!`)`(?!`)/gm,
		match => match.replace(/\$/g, '&!#36;'))

	// Render KaTeX in document
	content = content.replace(/\$\$(?!\s)(.*?)(?<!\s)\$\$/gs,
		(_, latex) =>
			{
				latex = latex
					.replaceAll('&!#36;', '$')
					.replaceAll('&!#96;', '`')
				return katex.renderToString(latex, { displayMode: true, throwOnError: false })
			})

	// Escape dollar characters in generated HTML
	content = content.replace(/<span.*?katex.*?>.*?<\/span>/gs,
		match => match.replace(/\$/g, '&!#36;'))

	// Render KaTeX in document
	content = content.replace(/\$(?!\s)([^\$]*?)(?<!\s)\$/gs,
		(_, latex) =>
			{
				latex = latex
					.replaceAll('&!#36;', '$')
					.replaceAll('&!#96;', '`')
				return katex.renderToString(latex, { displayMode: false, throwOnError: false })
			})

	// Escape dollar characters in generated HTML
	content = content.replace(/<span.*?katex.*?>.*?<\/span>/gs,
		match => match.replace(/\$/g, '&!#36;'))

	// Escape tilde characters in code blocks
	content = content.replace(/```.+?```(?=\s|$)/gs,
		match => match.replace(/~/g, '&!#126;'))
	content = content.replace(/(?<!`)`(?!`)[^\n]+?(?<!`)`(?!`)/gm,
		match => match.replace(/~/g, '&!#126;'))

	// Escape circumflex characters in code blocks
	content = content.replace(/```.+?```(?=\s|$)/gs,
		match => match.replace(/\^/g, '&!#93;'))
	content = content.replace(/(?<!`)`(?!`)[^\n]+?(?<!`)`(?!`)/gm,
		match => match.replace(/\^/g, '&!#93;'))

	// Escape equal characters in code blocks
	content = content.replace(/```.+?```(?=\s|$)/gs,
		match => match.replace(/=/g, '&!#61;'))
	content = content.replace(/(?<!`)`(?!`)[^\n]+?(?<!`)`(?!`)/gm,
		match => match.replace(/=/g, '&!#61;'))

	// Parse custom markdown
	content = content.replace(/~([^\n]+?)~/gm, '<sub>$1</sub>')
	content = content.replace(/\^([^\n]+?)\^/gm, '<sup>$1</sup>')
	content = content.replace(/==([^\n]+?)==/gm, '<mark>$1</mark>')

	// Restore escaped characters
	content = content.replace(/&!#36;/gs, '$')
	content = content.replace(/&!#96;/gs, '`')
	content = content.replace(/&!#126;/gs, '~')
	content = content.replace(/&!#93;/gs, '^')
	content = content.replace(/&!#61;/gs, '=')

	// Update file content
	await fs.promises.writeFile(path, content)
}
