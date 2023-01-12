import fs from 'fs'

import katex from 'katex'

const argFiles = process.argv.slice(2)

const files = argFiles.length > 0
	? argFiles
	: fs.readdirSync('.').filter(file => file.endsWith('.md'))

files.forEach(file =>
	{
		let content = fs.readFileSync(file, 'utf8')

		// Save escaped dollar characters
		content = content.replace(/\\\$/gs, '\\&!#36;')

		// Save escaped grave accent characters
		content = content.replace(/\\`/gs, '\\&!#96;')

		// Escape dollar characters in code blocks
		content = content.replace(/```.+?```(?=\s|$)/gs,
			match => match.replace(/\$/g, '&!#36;'))
		content = content.replace(/(?<!`)`(?!`).+?(?<!`)`(?!`)/gm,
			match => match.replace(/\$/g, '&!#36;'))

		// Render KaTeX in document
		content = content.replace(/\$\$(.*?)\$\$/gs,
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
		content = content.replace(/\$(.*?)\$/gs,
			(_, latex) =>
				{
					latex = latex
						.replaceAll('&!#36;', '\\$')
						.replaceAll('&!#96;', '\\`')
					return katex.renderToString(latex, { displayMode: false, throwOnError: false })
				})

		// Restore escaped characters
		content = content.replace(/&!#36;/gs, '$')
		content = content.replace(/&!#96;/gs, '`')

		fs.writeFileSync(file + '2.md', content)
	})
