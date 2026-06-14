"""Security tests Phase 6: Forum Diskusi.

Lihat docs/07-TASK-BREAKDOWN.md §6.13-6.14 dan docs/11-SECURITY.md.

Test coverage:
  FT-01  Semua user terotentikasi bisa membuat thread → 201
  FT-02  User tidak terotentikasi tidak bisa membuat thread → 401
  FT-03  Owner bisa mengedit thread miliknya → 200
  FT-04  Non-owner (warga lain) tidak bisa mengedit thread orang lain → 403
  FT-05  Non-owner (warga lain) tidak bisa menghapus thread orang lain → 403
  FT-06  Moderator (pengurus) bisa menghapus thread siapa pun → 200
  FT-07  Moderator bisa pin thread → 200
  FT-08  Moderator bisa lock thread → 200
  FT-09  Non-moderator tidak bisa pin thread → 403
  FT-10  Non-moderator tidak bisa lock thread → 403
  FT-11  Semua user terotentikasi bisa menambah komentar → 201
  FT-12  Thread yang terkunci tidak bisa menerima komentar → 422
  FT-13  Owner bisa edit komentarnya sendiri → 200
  FT-14  Non-owner tidak bisa edit komentar orang lain → 403
  FT-15  Moderator bisa hapus komentar siapa pun → 200
  FT-16  Non-moderator tidak bisa hapus komentar → 403
  FT-17  Toggle vote thread: tambah dan cabut → 200
"""

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import User
from forum.models import Comment, Thread, ThreadVote


# ──────────────────────────── helpers ────────────────────────────


def _make_user(email, role=User.Role.WARGA):
    return User.objects.create_user(
        username=email,
        email=email,
        phone=f"08{email[:12].replace('@', '').replace('.', '')[:10]}",
        password="Test1234!",
        role=role,
    )


def _auth(user):
    client = APIClient()
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")
    return client


def _create_thread(user, judul="Test Thread", status=Thread.Status.ACTIVE):
    return Thread.objects.create(
        judul=judul,
        isi="Isi thread test.",
        kategori=Thread.Kategori.LAINNYA,
        status=status,
        created_by=user,
    )


def _create_comment(thread, user, isi="Komentar test."):
    return Comment.objects.create(
        thread=thread,
        isi=isi,
        created_by=user,
    )


# ──────────────────────────── tests ────────────────────────────


class ThreadCreateTest(TestCase):
    """FT-01 / FT-02: Pembuatan thread."""

    def setUp(self):
        self.warga = _make_user("warga@test.com", User.Role.WARGA)
        self.client_warga = _auth(self.warga)
        self.anon_client = APIClient()

    def test_authenticated_user_can_create_thread(self):
        """FT-01: Semua user terotentikasi bisa membuat thread."""
        resp = self.client_warga.post(
            "/api/v1/forum/",
            data={"judul": "Thread Baru", "isi": "Isi thread.", "kategori": "lainnya"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["data"]["judul"], "Thread Baru")

    def test_unauthenticated_user_cannot_create_thread(self):
        """FT-02: User tidak terotentikasi tidak bisa membuat thread."""
        resp = self.anon_client.post(
            "/api/v1/forum/",
            data={"judul": "Thread Hacker", "isi": "Isi.", "kategori": "lainnya"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)


class ThreadEditPermissionTest(TestCase):
    """FT-03 / FT-04 / FT-05 / FT-06: Permission edit dan hapus thread."""

    def setUp(self):
        self.owner = _make_user("owner@test.com", User.Role.WARGA)
        self.other_warga = _make_user("other@test.com", User.Role.WARGA)
        self.pengurus = _make_user("pengurus@test.com", User.Role.PENGURUS)
        self.client_owner = _auth(self.owner)
        self.client_other = _auth(self.other_warga)
        self.client_pengurus = _auth(self.pengurus)
        self.thread = _create_thread(self.owner, "Thread Owner")

    def test_owner_can_edit_own_thread(self):
        """FT-03: Owner bisa mengedit thread miliknya."""
        resp = self.client_owner.put(
            f"/api/v1/forum/{self.thread.id}/",
            data={"judul": "Thread Diubah"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.thread.refresh_from_db()
        self.assertEqual(self.thread.judul, "Thread Diubah")

    def test_non_owner_cannot_edit_other_thread(self):
        """FT-04: Non-owner (warga lain) tidak bisa mengedit thread orang lain."""
        resp = self.client_other.put(
            f"/api/v1/forum/{self.thread.id}/",
            data={"judul": "Hacked"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_non_owner_cannot_delete_other_thread(self):
        """FT-05: Non-owner (warga lain) tidak bisa menghapus thread orang lain."""
        resp = self.client_other.delete(f"/api/v1/forum/{self.thread.id}/")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_moderator_can_delete_any_thread(self):
        """FT-06: Moderator (pengurus) bisa menghapus thread siapa pun."""
        resp = self.client_pengurus.delete(f"/api/v1/forum/{self.thread.id}/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertFalse(Thread.objects.filter(pk=self.thread.pk).exists())


class ThreadModerationTest(TestCase):
    """FT-07 / FT-08 / FT-09 / FT-10: Moderasi thread (pin/lock)."""

    def setUp(self):
        self.warga = _make_user("warga2@test.com", User.Role.WARGA)
        self.pengurus = _make_user("pengurus2@test.com", User.Role.PENGURUS)
        self.admin = _make_user("admin@test.com", User.Role.ADMIN)
        self.client_warga = _auth(self.warga)
        self.client_pengurus = _auth(self.pengurus)
        self.client_admin = _auth(self.admin)
        self.thread = _create_thread(self.warga, "Thread Moderasi")

    def test_moderator_can_pin_thread(self):
        """FT-07: Moderator bisa pin thread."""
        resp = self.client_pengurus.put(f"/api/v1/forum/{self.thread.id}/pin/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.thread.refresh_from_db()
        self.assertEqual(self.thread.status, Thread.Status.PINNED)

    def test_moderator_can_lock_thread(self):
        """FT-08: Moderator bisa lock thread."""
        resp = self.client_pengurus.put(f"/api/v1/forum/{self.thread.id}/lock/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.thread.refresh_from_db()
        self.assertEqual(self.thread.status, Thread.Status.LOCKED)

    def test_non_moderator_cannot_pin_thread(self):
        """FT-09: Non-moderator tidak bisa pin thread."""
        resp = self.client_warga.put(f"/api/v1/forum/{self.thread.id}/pin/")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_non_moderator_cannot_lock_thread(self):
        """FT-10: Non-moderator tidak bisa lock thread."""
        resp = self.client_warga.put(f"/api/v1/forum/{self.thread.id}/lock/")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_pin_thread(self):
        """Admin (juga moderator) bisa pin thread."""
        resp = self.client_admin.put(f"/api/v1/forum/{self.thread.id}/pin/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)


class CommentPermissionTest(TestCase):
    """FT-11 / FT-12: Komentar pada thread."""

    def setUp(self):
        self.owner = _make_user("owner2@test.com", User.Role.WARGA)
        self.other = _make_user("other2@test.com", User.Role.WARGA)
        self.client_owner = _auth(self.owner)
        self.client_other = _auth(self.other)
        self.thread_active = _create_thread(self.owner, "Thread Aktif")
        self.thread_locked = _create_thread(self.owner, "Thread Terkunci", Thread.Status.LOCKED)

    def test_authenticated_user_can_add_comment(self):
        """FT-11: Semua user terotentikasi bisa menambah komentar pada thread aktif."""
        resp = self.client_other.post(
            f"/api/v1/forum/{self.thread_active.id}/comments/",
            data={"isi": "Komentar saya."},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_locked_thread_cannot_receive_comment(self):
        """FT-12: Thread terkunci tidak bisa menerima komentar baru → 422."""
        resp = self.client_other.post(
            f"/api/v1/forum/{self.thread_locked.id}/comments/",
            data={"isi": "Coba komentar."},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertEqual(resp.data["code"], "FORUM_THREAD_LOCKED")


class CommentEditDeleteTest(TestCase):
    """FT-13 / FT-14 / FT-15 / FT-16: Edit dan hapus komentar."""

    def setUp(self):
        self.comment_owner = _make_user("commentowner@test.com", User.Role.WARGA)
        self.other_warga = _make_user("otherwarga@test.com", User.Role.WARGA)
        self.pengurus = _make_user("pengurus3@test.com", User.Role.PENGURUS)
        self.client_owner = _auth(self.comment_owner)
        self.client_other = _auth(self.other_warga)
        self.client_pengurus = _auth(self.pengurus)
        self.thread = _create_thread(self.comment_owner)
        self.comment = _create_comment(self.thread, self.comment_owner)

    def test_owner_can_edit_own_comment(self):
        """FT-13: Owner bisa edit komentarnya sendiri."""
        resp = self.client_owner.put(
            f"/api/v1/forum/comments/{self.comment.id}/",
            data={"isi": "Komentar diubah."},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.comment.refresh_from_db()
        self.assertEqual(self.comment.isi, "Komentar diubah.")

    def test_non_owner_cannot_edit_other_comment(self):
        """FT-14: Non-owner tidak bisa edit komentar orang lain → 403."""
        resp = self.client_other.put(
            f"/api/v1/forum/comments/{self.comment.id}/",
            data={"isi": "Hacked."},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_moderator_can_delete_any_comment(self):
        """FT-15: Moderator bisa hapus komentar siapa pun."""
        resp = self.client_pengurus.delete(f"/api/v1/forum/comments/{self.comment.id}/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertFalse(Comment.objects.filter(pk=self.comment.pk).exists())

    def test_non_moderator_cannot_delete_comment(self):
        """FT-16: Non-moderator (bukan pemilik) tidak bisa hapus komentar → 403."""
        resp = self.client_other.delete(f"/api/v1/forum/comments/{self.comment.id}/")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)


class ThreadVoteTest(TestCase):
    """FT-17: Toggle vote thread."""

    def setUp(self):
        self.warga = _make_user("voter@test.com", User.Role.WARGA)
        self.thread_owner = _make_user("towner@test.com", User.Role.WARGA)
        self.client_warga = _auth(self.warga)
        self.thread = _create_thread(self.thread_owner)

    def test_toggle_vote_add_and_remove(self):
        """FT-17: Vote pertama menambahkan, vote kedua mencabut."""
        # Vote pertama → hasVoted: True
        resp = self.client_warga.post(f"/api/v1/forum/{self.thread.id}/vote/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(resp.data["data"]["hasVoted"])
        self.assertEqual(resp.data["data"]["voteCount"], 1)
        self.assertTrue(ThreadVote.objects.filter(thread=self.thread, user=self.warga).exists())

        # Vote kedua (toggle) → hasVoted: False
        resp = self.client_warga.post(f"/api/v1/forum/{self.thread.id}/vote/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertFalse(resp.data["data"]["hasVoted"])
        self.assertEqual(resp.data["data"]["voteCount"], 0)
        self.assertFalse(ThreadVote.objects.filter(thread=self.thread, user=self.warga).exists())


class ThreadListFilterTest(TestCase):
    """List thread dengan filter dan pagination."""

    def setUp(self):
        self.warga = _make_user("listuser@test.com", User.Role.WARGA)
        self.client_warga = _auth(self.warga)
        _create_thread(self.warga, "Thread Keamanan A", Thread.Status.ACTIVE)
        _create_thread(self.warga, "Thread Keamanan B", Thread.Status.ACTIVE)

        # Ganti kategori thread B
        t = Thread.objects.get(judul="Thread Keamanan B")
        t.kategori = Thread.Kategori.KEAMANAN
        t.save()

        _create_thread(self.warga, "Thread Kebersihan", Thread.Status.ACTIVE)
        t2 = Thread.objects.get(judul="Thread Kebersihan")
        t2.kategori = Thread.Kategori.KEBERSIHAN
        t2.save()

    def test_list_threads_returns_paginated(self):
        """List thread mengembalikan response dengan pagination."""
        resp = self.client_warga.get("/api/v1/forum/?limit=2")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("pagination", resp.data)
        self.assertLessEqual(len(resp.data["data"]), 2)

    def test_filter_by_kategori(self):
        """Filter kategori hanya mengembalikan thread dengan kategori tersebut."""
        resp = self.client_warga.get("/api/v1/forum/?kategori=keamanan")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        for item in resp.data["data"]:
            self.assertEqual(item["kategori"], "keamanan")


class ReplyCommentTest(TestCase):
    """Reply komentar (komentar bersarang)."""

    def setUp(self):
        self.warga = _make_user("replyuser@test.com", User.Role.WARGA)
        self.client_warga = _auth(self.warga)
        self.thread = _create_thread(self.warga)
        self.parent_comment = _create_comment(self.thread, self.warga, "Komentar induk.")

    def test_can_reply_to_comment(self):
        """Bisa membalas komentar dengan parentId."""
        resp = self.client_warga.post(
            f"/api/v1/forum/{self.thread.id}/comments/",
            data={"isi": "Balasan komentar.", "parentId": str(self.parent_comment.id)},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        reply = Comment.objects.get(isi="Balasan komentar.")
        self.assertEqual(reply.parent_id, self.parent_comment.id)

    def test_cannot_reply_with_wrong_thread_parent(self):
        """parentId yang tidak ada di thread ini → 400."""
        other_thread = _create_thread(self.warga, "Thread Lain")
        other_comment = _create_comment(other_thread, self.warga, "Komentar di thread lain.")
        resp = self.client_warga.post(
            f"/api/v1/forum/{self.thread.id}/comments/",
            data={"isi": "Balasan invalid.", "parentId": str(other_comment.id)},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
