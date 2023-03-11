## Guide

- This is a rough skeleton, some of you have the html and css ready. This is mainly for javascript
- These are two unique ways but please still manipulate it as you add more to html and css.
- You can create individual files html css js(For some of you please do) and in the server side use:

app.use(express.static(\_\_dirname + "/public"));

instead of

app.get("/", (req, res) => {
res.sendFile(\_\_dirname + "/restaurant.html");
});

## Conclusion

Hope this helps. Goodluck!
