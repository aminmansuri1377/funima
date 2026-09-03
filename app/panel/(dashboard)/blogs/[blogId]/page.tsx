import { EditBlogManager } from "@/components/panel/blogs/edit-blog-manager";

type Props = {
  params: Promise<{
    blogId: string;
  }>;
};

export default async function EditBlogPage({ params }: Props) {
  const { blogId } = await params;

  return <EditBlogManager blogId={blogId} />;
}
