export type ThreadKategori = 'keamanan' | 'kebersihan' | 'acara' | 'usul' | 'lainnya'
export type ThreadStatus = 'active' | 'pinned' | 'locked'

export interface ThreadCreatedBy {
  id: string
  namaLengkap: string
}

export interface Reply {
  id: string
  isi: string
  createdBy: ThreadCreatedBy
  createdAt: string
  updatedAt: string
}

export interface Comment {
  id: string
  isi: string
  createdBy: ThreadCreatedBy
  createdAt: string
  updatedAt: string
  replies: Reply[]
}

export interface Thread {
  id: string
  judul: string
  kategori: ThreadKategori
  status: ThreadStatus
  createdBy: ThreadCreatedBy
  createdAt: string
  updatedAt: string
  commentCount: number
  voteCount: number
}

export interface ThreadDetail extends Thread {
  isi: string
  comments: Comment[]
  hasVoted: boolean
}

export interface ThreadListResponse {
  status: string
  data: Thread[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ThreadDetailResponse {
  status: string
  data: ThreadDetail
}

export interface VoteResponse {
  status: string
  data: { voteCount: number; hasVoted: boolean }
  message: string
}
