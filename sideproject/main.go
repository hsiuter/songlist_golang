package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"

	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"
	_ "github.com/mattn/go-sqlite3"
	"github.com/xuri/excelize/v2"
)

var db *sql.DB

func main() {
	var err error
	db, err = sql.Open("sqlite3", "./database.db")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	// 创建用户、歌单和主题表
	createTables()

	r := gin.Default()
	store := cookie.NewStore([]byte("secret"))
	r.Use(sessions.Sessions("mysession", store))

	r.LoadHTMLGlob("template/html/*")

	r.GET("/register", IndexPage)
	r.GET("/uploadpage", UploadPage)
	r.GET("/loginpage", LoginPage)
	// r.GET("/songlistpage", SonglistPage)
	// 在main函数中，添加一个新的带参数的路由
	r.GET("/:username/songlistpage", SonglistPage)

	r.POST("/register", handleRegistration)
	r.POST("/login", handleLogin)
	r.POST("/update-theme", handleThemeUpdate)
	r.POST("/upload-songlist", handleSongListUpload)
	r.POST("/display-songlist", handleSongListDisplay)
	r.POST("/update-songlist", handleSongListUpdate)

	fmt.Println("Server is listening on port 8080...")
	err = r.Run(":8080")
	if err != nil {
		log.Fatal(err)
	}
}

func createTables() {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY,
			username TEXT,
			password TEXT,
			email TEXT
		);
		CREATE TABLE IF NOT EXISTS playlists (
			id INTEGER PRIMARY KEY,
			user_id INTEGER,
			name TEXT,
			language TEXT,
			description TEXT,
			FOREIGN KEY(user_id) REFERENCES users(id)
		);
		CREATE TABLE IF NOT EXISTS theme (
			id INTEGER PRIMARY KEY,
			user_id INTEGER,
			main_color TEXT,
			sub_color TEXT,
			FOREIGN KEY(user_id) REFERENCES users(id)
		);
	`)
	if err != nil {
		log.Fatal(err)
	}
}
func handleRegistration(c *gin.Context) {
	username := c.PostForm("username")
	password := c.PostForm("password")
	email := c.PostForm("email")

	if username == "" || password == "" {
		c.String(http.StatusBadRequest, "用户名和密码不能为空")
		return
	}

	_, err := db.Exec("INSERT INTO users (username, password, email) VALUES (?, ?, ?)", username, password, email)
	if err != nil {
		c.String(http.StatusInternalServerError, "注册失败")
		log.Println("注册失败:", err)
		return
	}

	c.String(http.StatusOK, "注册成功")
}

func handleLogin(c *gin.Context) {
	username := c.PostForm("username")
	password := c.PostForm("password")

	var userID int
	err := db.QueryRow("SELECT id FROM users WHERE username = ? AND password = ?", username, password).Scan(&userID)
	if err != nil {
		if err == sql.ErrNoRows {
			c.String(http.StatusUnauthorized, "无效的用户名或密码")
		} else {
			c.String(http.StatusInternalServerError, "服务器错误")
		}
		return
	}

	session := sessions.Default(c)
	session.Set("user_id", userID)
	session.Set("username", username) // 存储用户名到会话中
	session.Save()

	c.Redirect(http.StatusFound, fmt.Sprintf("/%s/songlistpage", username))

	// c.String(http.StatusOK, "登录成功")
	// c.Redirect(http.StatusFound, "/uploadpage")
}

func IndexPage(c *gin.Context) {
	c.HTML(http.StatusOK, "index.html", nil)
}

func UploadPage(c *gin.Context) {
	c.HTML(http.StatusOK, "upload.html", nil)
}

func LoginPage(c *gin.Context) {
	c.HTML(http.StatusOK, "login.html", nil)
}

func SonglistPage(c *gin.Context) {
	username := c.Param("username")

	// 可以根据用户名来获取用户特定的数据
	// ...

	c.HTML(http.StatusOK, "songlist.html", gin.H{
		"Username": username,
		// 其他需要传递给模板的数据
	})
}

func handleThemeUpdate(c *gin.Context) {
	session := sessions.Default(c)
	userID := session.Get("user_id")

	mainColor := c.PostForm("main_color")
	subColor := c.PostForm("sub_color")

	_, err := db.Exec("UPDATE theme SET main_color = ?, sub_color = ? WHERE user_id = ?", mainColor, subColor, userID)
	if err != nil {
		c.String(http.StatusInternalServerError, "更新主题失败")
		return
	}

	c.String(http.StatusOK, "主题更新成功")
}
func handleSongListUpload(c *gin.Context) {
	session := sessions.Default(c)
	userID := session.Get("user_id")

	// 檢查用戶是否已登錄
	if userID == nil {
		c.String(http.StatusUnauthorized, "請先登錄")
		return
	}

	file, err := c.FormFile("songlist")
	if err != nil {
		c.String(http.StatusBadRequest, "获取文件出错")
		return
	}

	filePath := "./tmp/" + file.Filename
	if err := c.SaveUploadedFile(file, filePath); err != nil {
		c.String(http.StatusInternalServerError, "保存文件失败")
		return
	}

	f, err := excelize.OpenFile(filePath)
	if err != nil {
		c.String(http.StatusInternalServerError, "打开文件失败")
		return
	}
	rows, err := f.GetRows("工作表1")
	if err != nil {
		c.String(http.StatusInternalServerError, "读取 Excel 失败")
		return
	}

	for _, row := range rows {
		_, err = db.Exec("INSERT INTO playlists (user_id, name, language, description) VALUES (?, ?, ?, ?)", userID, row[0], row[1], row[2])
		if err != nil {
			c.String(http.StatusInternalServerError, "存储数据失败")
			return
		}
	}

	c.String(http.StatusOK, "上传成功")
}
func handleSongListDisplay(c *gin.Context) {
	session := sessions.Default(c)
	userID := session.Get("user_id")

	rows, err := db.Query("SELECT name, language, description FROM playlists WHERE user_id = ?", userID)
	if err != nil {
		c.String(http.StatusInternalServerError, "查询歌单失败")
		return
	}
	defer rows.Close()

	var playlists []struct {
		Name        string
		Language    string
		Description string
	}

	for rows.Next() {
		var p struct {
			Name        string
			Language    string
			Description string
		}
		if err := rows.Scan(&p.Name, &p.Language, &p.Description); err != nil {
			c.String(http.StatusInternalServerError, "读取歌单失败")
			return
		}
		playlists = append(playlists, p)
	}

	c.JSON(http.StatusOK, playlists)
}
func handleSongListUpdate(c *gin.Context) {
	playlistID := c.PostForm("playlist_id")
	name := c.PostForm("name")
	language := c.PostForm("language")
	description := c.PostForm("description")

	_, err := db.Exec("UPDATE playlists SET name = ?, language = ?, description = ? WHERE id = ?", name, language, description, playlistID)
	if err != nil {
		c.String(http.StatusInternalServerError, "更新歌单失败")
		return
	}

	c.String(http.StatusOK, "歌单更新成功")
}
