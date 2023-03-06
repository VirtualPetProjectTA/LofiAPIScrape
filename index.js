const express = require("express");
const axios = require("axios");

const { JSDOM } = require("jsdom");

const app = express();
const fuzzy = require("fuzzy");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const baseUrl = "https://lofigirl.com/blogs";
let status;
const fetchPages = async (url) => {
  try {
    const response = await axios.get(url);
    status = response?.status;
    return response?.data;
  } catch (e) {
    status = e?.response?.status;
    console.log("e : ", e);
  }
};

const fetchReleasePages = async () => {
  const pages = await fetchPages(`${baseUrl}/releases`);

  const dom = new JSDOM(pages).window.document;
  const arrP = [];

  dom
    .querySelectorAll(".CV_release_tab_structure .Cv_release_mini_wrap")
    .forEach(async (item) => {
      if (item.querySelector("img").getAttribute("src") !== null) {
        arrP.push({
          link: item.querySelector("a").getAttribute("href"),
          image: item.querySelector("img").getAttribute("src"),
          title: item.querySelector("h2").textContent,
        });
      }
    });

  return arrP;
};

app.get("/", (req, res) => {
  fetchReleasePages().then((response) => {
    res.send({ status, data: response });
  });
});

app.get("/blogs/releases/:title", (req, res) => {
  const fetchReleasePages = async () => {
    const pages = await fetchPages(`${baseUrl}/releases/${req.params.title}`);
    const dom = new JSDOM(pages).window.document;
    const results = {};
    const arrSongs = [];

    results["titleAlbum"] = dom
      .querySelector(".cv_custom_release_album_main_outer h2")
      .textContent.trim();
    results["artistName"] = dom
      .querySelector(".cv_custom_artist_links_outer a")
      .textContent.trim();

    results["artistLink"] = `/artist/${dom
      .querySelector(".cv_custom_artist_link_inner_content a")
      .getAttribute("href")
      .split("/")
      ?.pop()}`;

    dom
      .querySelectorAll(".cv_custom_album_play_contents_inner_part")
      .forEach((item) => {
        arrSongs.push({
          titleSong: item.querySelector("h4").textContent,
          linkSong: item
            .querySelector(".cv_custom_download_icon_part")
            .getAttribute("data-audio-src"),
        });
      });
    results["songs"] = arrSongs;

    return results;
  };

  fetchReleasePages().then((response) => res.send({ status, data: response }));
});

app.get("/artist/:artist_name", (req, res) => {
  const fetchReleasePages = async () => {
    const pages = await fetchPages(
      `${baseUrl}/artist/${req.params.artist_name}`
    );
    const dom = new JSDOM(pages).window.document;
    const results = {};
    const arrReleases = [];

    const artistWrapperDOM = dom.querySelector(
      ".cv_custom_artist_banner_image_with_profile"
    );
    results["artistName"] = artistWrapperDOM.querySelector(
      ".cv_custom_profile_artist_content_text_part h2"
    ).textContent;

    results["aritstPhoto"] = `https:${artistWrapperDOM
      .querySelector(".cv_custom_artist_profile_img")
      .getAttribute("data-src")}`;

    results["artistBackgroundImage"] = artistWrapperDOM
      .querySelector(".cv_custom_artist_main_banner_image img")
      .getAttribute("src");

    dom
      .querySelectorAll(".cv_custom_streamline_inner_contents_for_songs")
      .forEach((item) => {
        arrReleases?.push({
          albumImage: item?.querySelector("img").getAttribute("data-src"),
          albumName: item?.querySelector(".cv_custom_artist_content_heading")
            .textContent,
          albumLink: item
            ?.querySelector(
              ".cv_custom_artist_contents_streamline_button_part a"
            )
            .getAttribute("href"),
        });
      });

    results["artistReleases"] = arrReleases;
    return results;
  };

  fetchReleasePages().then((response) => {
    res.send({ status, data: response });
  });
});

app.get("/cari/:searchKey", (req, res) => {
  const searchKey = req.params.searchKey;

  fetchReleasePages().then((response) => {
    var options = {
      extract: (item) => item?.title,
    };
    var results = fuzzy.filter(searchKey.toLowerCase(), response, options);
    var matches = results.map((item) => item?.string);
    const newData = [];
    if (Array.isArray(response) && response?.length) {
      matches?.forEach((item) => {
        newData.push(response?.find((data) => data?.title === item));
      });
    }
    res.send({ status, data: newData });
  });
});

app.listen(3001);
