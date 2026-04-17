package models

import "time"

type Post struct {
	ID          uint       `gorm:"primaryKey" json:"id"`
	Title       string     `gorm:"not null" json:"title"`
	Slug        string     `gorm:"uniqueIndex;not null" json:"slug"`
	Content     string     `gorm:"type:text" json:"content"`
	AuthorID    uint       `gorm:"not null" json:"authorId"`
	Author      User       `json:"author,omitempty"`
	Category    string     `json:"category"`
	PublishedAt *time.Time `json:"publishedAt"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}
