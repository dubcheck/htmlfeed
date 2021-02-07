const fastify = require('fastify')({
    logger: true
  });
const fetch = require('node-fetch');
const { parse } = require('node-html-parser');
const { Feed } = require('feed');
const { DateTime } = require('luxon');

fastify.get('/archiv/:relacia', async (request, reply) => {
    console.log(request.relacia);
    reply
        .header('Content-Type', 'application/xml; charset=utf-8')
        .send((await parsujArchiv(request.params.relacia)).atom1());
});

fastify.listen(4488, (err, address) => {
    if (err) {
        throw err;
    }
    fastify.log.info(`server listening on ${address}`);
});


async function parsujArchiv(relacia) {
    const celaAdresa = 'https://www.infovojna.sk/archiv/' + relacia;

    const response = await fetch(celaAdresa);
    const document = parse(await response.text());

    const feed = new Feed({
        title: document.querySelector('article h2').innerText,
        description: document.querySelector('.showdesc .desc').innerText,
        id: celaAdresa,
        link: celaAdresa,
        language: 'sk',
        image: document.querySelector('.showdesc img').getAttribute('src'),
        favicon: 'https://www.infovojna.sk/images/iv_logo_new.png',
        copyright: document.querySelector('.copyright').innerText,

    });

    const zoznamVysielani = Array.from(document.querySelectorAll('#archlst li')).filter(element => element.querySelector('div.headesc'));

    for (const vysielanie of zoznamVysielani) {
        feed.addItem({
            title: vysielanie.querySelector('div.headesc strong').innerText,
            id: vysielanie.querySelector('.right.lne a').getAttribute('data-id'),
            link: vysielanie.querySelector('.right.lne a').getAttribute('href'),
            date: DateTime.fromFormat(vysielanie.querySelector('.headesc strong').innerText, 'dd.MM.yyyy').toJSDate(),
            description: Array.from(vysielanie.querySelectorAll('.headesc p')).reduce((vysledok, element) => vysledok + element.toString() + '\n', '')
        });
    }

    return feed;
}