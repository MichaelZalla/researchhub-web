import { useRouter } from "next/router";
import { useDispatch, useStore } from "react-redux";

import TextEditor from "~/components/TextEditor";

import DiscussionActions from "~/redux/discussion";
import { deserializeEditor } from "../config/utils/serializers";

const ThreadEditor = (props) => {
  const { readOnly, onSubmit } = props;

  const dispatch = useDispatch();
  const store = useStore();
  const router = useRouter();

  const { paperId, discussionThreadId } = router.query;

  const text = deserializeEditor(props.text);

  async function updateThread() {
    dispatch(DiscussionActions.updateThreadPending());
    await dispatch(
      DiscussionActions.updateThread(paperId, discussionThreadId, text)
    );

    const thread = store.getState().discussion.updatedThread;
    // onSubmit(thread);
  }

  return (
    <TextEditor
      readOnly={readOnly}
      onSubmit={updateThread}
      initialValue={text}
    />
  );
};

export default ThreadEditor;
