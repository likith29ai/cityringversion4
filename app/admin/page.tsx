"use client";

import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <main>
      <h1 className="text-4xl font-bold">Admin dashboard</h1>
      <p className="mt-2 text-zinc-600">
        Approve memberships, handle join requests, and create new groups.
      </p>

      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          href="/admin/approvals"
          className="bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition"
        >
          <div className="text-lg font-semibold">Membership approvals</div>
          <div className="mt-1 text-sm text-zinc-600">
            Approve or reject payments and memberships.
          </div>
        </Link>

        <Link
          href="/admin/join-requests"
          className="bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition"
        >
          <div className="text-lg font-semibold">Group join requests</div>
          <div className="mt-1 text-sm text-zinc-600">
            Approve or reject ring join requests.
          </div>
        </Link>

        <Link
          href="/admin/groups/new"
          className="bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition"
        >
          <div className="text-lg font-semibold">Create a group</div>
          <div className="mt-1 text-sm text-zinc-600">
            Insert a new group (title, city, image).
          </div>
        </Link>

        {/* NEW BUTTONS ADDED BELOW */}

        <Link
          href="/admin/plans"
          className="bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition"
        >
          <div className="text-lg font-semibold">Membership plans</div>
          <div className="mt-1 text-sm text-zinc-600">
            Create and manage membership plans.
          </div>
        </Link>

        <Link
          href="/admin/exclusive-applications"
          className="bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition"
        >
          <div className="text-lg font-semibold">Exclusive applications</div>
          <div className="mt-1 text-sm text-zinc-600">
            Approve or reject exclusive group applications.
          </div>
        </Link>

        <Link
          href="/admin/homepage"
          className="bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition"
        >
          <div className="text-lg font-semibold">Homepage management</div>
          <div className="mt-1 text-sm text-zinc-600">
            Edit homepage sections and featured content.
          </div>
        </Link>

        <Link
          href="/admin/users"
          className="bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition"
        >
          <div className="text-lg font-semibold">Users</div>
          <div className="mt-1 text-sm text-zinc-600">
            View members, subscriptions, and payment status.
          </div>
        </Link>
      </div>
    </main>
  );
}