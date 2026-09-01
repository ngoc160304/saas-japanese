from livekit import api

from config.enviroments import eviroment


def generate_token(room_name: str, identity: str, username: str) -> str:
    return (
        api.AccessToken(eviroment.LIVEKIT_API_KEY, eviroment.LIVEKIT_API_SECRET)
        .with_identity(identity)
        .with_name(username)
        .with_grants(
            api.VideoGrants(
                room_join=True,
                room=room_name,
                can_publish=True,
                can_subscribe=True,
                can_publish_data=True,
            )
        )
        .to_jwt()
    )
