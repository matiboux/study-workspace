$(() => {

	const $content = $('#main .content')

	// -- Escape dollar signs
	// -- Render math equations

	// Save escaped dollar signs
	$content.html($content.html().replace('\\$', '\\!#36'))

	// Render KaTeX in document
	renderMathInElement($content[0], {
			delimiters: [
				{ left: "$$", right: "$$", display: true },
				{ left: "$", right: "$", display: false },
				{ left: "\\(", right: "\\)", display: false },
				{ left: "\\[", right: "\\]", display: true },
			]
		})

	// Restore escaped dollar signs
	$content.html($content.html().replace('\\!#36', '$'))

	// -- Parse additional markdown syntax outside code blocks

	const replacePairs = [
		// Subscript
		[/(?<!\\)((?:\\\\)*)\~(.+?(?<!\\)(?:\\\\)*)\~/gi, '$1<sub>$2</sub>'],
		// Superscript
		[/(?<!\\)((?:\\\\)*)\^(.+?(?<!\\)(?:\\\\)*)\^/gi, '$1<sup>$2</sup>'],
	]

	const splitregex = /(<code>.*?<\/code>)/gis
	$content.html(
			$content.html().split(splitregex)
				.map(str =>
					{
						if (!str) return str
						if (str.match(splitregex)) return str
						return replacePairs.reduce((str, replacePair) => str.replace(...replacePair), str)
					})
				.join('')
		)

	// -- Render Mermaid

	$content.html($content.html().replace(
		/<pre>.*?<code.+?class="language-mermaid".*?>(.+?)<\/code>.*?<\/pre>/gis,
		(match, code) => `<div class="mermaid">${code}</div>`))
	mermaid.initialize({ startOnLoad: true })

	// -- Breadcrumb

	const $breadcrumb = $('#breadcrumb')
	const $breadcrumbList = $breadcrumb.find('ul')

	// Breadcrumb
	const pathparts = window.location.pathname.split('/');
	let pathurl = window.location.origin;
	$.each(pathparts, (i, value) => {
		pathurl += value;
		if (i + 1 < pathparts.length) {
			if (!pathparts[i + 1]) return;
			pathurl += '/';
		}
		else value = $('h1').text();

		$breadcrumbList.append($('<li>').append($('<a>').attr('href', pathurl).html(value ? value : 'Home')));
	});

	// -- Table of contents

	const $sidebar = $('#main .sidebar')
	const $togglesidebar = $('.toggle-sidebar')
	const $toc = $sidebar.find('.toc')

	// Generate table of contents if missing
	if ($toc.children().length <= 0)
	{
		let toc = ""
		let level = 0

		// Match heading tags
		const matches = $content.html().matchAll(/<h([\d]).+?id="(.+?)".*?>(.*?)<\/h\1>/gis)
		for (match of matches)
		{
			const headingLevel = parseInt(match[1])
			const headingId = match[2]
			const headingText = match[3]

			if (headingLevel > level)
			{
				// One level deeper
				toc += (new Array(headingLevel - level + 1)).join('<ul>')
				level = headingLevel
			}
			else if (headingLevel < level)
			{
				// One level higher
				toc += (new Array(level - headingLevel + 1)).join('</ul>')
				level = headingLevel
			}
			else
			{
				// Same level
				toc += '</li>'
			}

			toc += `<li><a href="#${headingId}">${headingText}</a>`
		}

		if (level >= 0)
		{
			toc += (new Array(level + 1)).join('</ul>')
		}

		$toc.html(toc)
	}

	// Table of Contents
	const scrollHandle = () => {
		const posY = $(this).scrollTop()
		const offset = Math.max(0, $breadcrumb.scrollTop() + $breadcrumb.outerHeight() - posY)
		const height = $(window).outerHeight() - offset

		$sidebar.css('top', offset)
		$sidebar.css('height', height)
	}
	$(document).scroll(scrollHandle)
	$(window).resize(scrollHandle)
	scrollHandle()

	// Toggle Sidebar
	$togglesidebar.click(event => {
		event.preventDefault()
		$sidebar.addClass('open')
		scrollHandle()
	});
	$(document).mouseup(e => {
		if ($sidebar.is(e.target)
			|| $togglesidebar.is(e.target)
			|| $sidebar.has(e.target).length !== 0)
		{
			return
		}

		$sidebar.removeClass('open')
	});

	// -- Render emojis

	// Enable Twemoji
	twemoji.parse(document.body,
		{
			folder: 'svg',
			ext: '.svg',
		})

})
