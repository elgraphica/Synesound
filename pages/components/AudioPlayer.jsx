import { currentTrackIdState, isPlayingState } from '@/atoms/songAtom';
import useSongInfo from '@/hooks/useSongInfo';
import useSpotify from '@/hooks/useSpotify'
import { SwitchHorizontalIcon, VolumeUpIcon as VolumeDownIcon } from '@heroicons/react/outline';
import { PlayIcon, PauseIcon, RewindIcon, FastForwardIcon, ReplyIcon, VolumeUpIcon } from '@heroicons/react/solid';
import { debounce } from 'lodash';

import { useSession } from 'next-auth/react';
import React, { useCallback, useEffect, useState } from 'react'
import { useRecoilState } from 'recoil';

function Player() {
    const spotifyApi = useSpotify();
    const { data: session, status } = useSession();
    const [currentTrackId, setCurrentIdTrack] = useRecoilState(currentTrackIdState);

    const [isPlaying, setIsPlaying] = useRecoilState(isPlayingState);

    const [volume, setVolume] = useState(50);

    const songInfo = useSongInfo();

    const skipToNextTrack = () => {
        spotifyApi.skipToNext()
            .then(function () {
                console.log('Skip to next');
            }, function (err) {
                //if the user making the request is non-premium, a 403 FORBIDDEN response code will be returned
                console.log('Something went wrong!', err);
            });
    }

    const skipToPrevious = () => {
        spotifyApi.skipToPrevious()
            .then(function () {
                console.log('Skip to previous');
            }, function (err) {
                //if the user making the request is non-premium, a 403 FORBIDDEN response code will be returned
                console.log('Something went wrong!', err);
            });
    }

    const fetchCurrentSong = () => {
        if (!songInfo) {
            spotifyApi.getMyCurrentPlayingTrack().then(data => {
                console.log("Now playing: ", data.body?.item);
                setCurrentIdTrack(data.body?.item?.id);

                spotifyApi.getMyCurrentPlaybackState().then((data) => {
                    setIsPlaying(data.body?.is_playing);
                })
            });
        }
    };

    const handlePlayPause = () => {
        spotifyApi.getMyCurrentPlaybackState().then((data) => {
            if (data.body.is_playing) {
                spotifyApi.pause();
                setIsPlaying(false);
            } else {
                spotifyApi.play();
                setIsPlaying(true);
            }
        });
    };


    useEffect(() => {
        if (spotifyApi.getAccessToken() && !currentTrackId) {
            fetchCurrentSong();
            setVolume(50);
        }

    }, [currentTrackIdState, spotifyApi, session]);

    useEffect(() => {
        if (volume > 0 && volume < 100) {
            debouncedAdjustVolume(volume);
        }

    }, [volume]);

    const debouncedAdjustVolume = useCallback(
        debounce((volume) => {
            spotifyApi.setVolume(volume).catch((err) => { });
        }, 500), []
    );

    return (
        <div className='h-24  text-white grid grid-cols-3 text-xs md:text-base px-2 md:px-8'>
            {/* Left */}
            <div className='flex items-center space-x-4'>
                <img className='hidden md:inline h-10 w-10' src={songInfo?.album.images?.[0]?.url} alt="" />
                <div>
                    <h3>{songInfo?.name} </h3>
                    <p>{songInfo?.artists?.[0]?.name} </p>
                </div>
            </div>
            {/* Center */}
            <div className='flex items-center justify-evenly'>
                <SwitchHorizontalIcon className='button' />
                <RewindIcon onClick={skipToPrevious} className='button' />
                {/* onClick={() => spotifyApi.skipToPrevious()}  not working*/}
                {isPlaying ? (
                    <PauseIcon onClick={handlePlayPause} className='button w-10 h-10' />
                ) : (
                    <PlayIcon onClick={handlePlayPause} className='button w-10 h-10' />
                )}

                <FastForwardIcon onClick={skipToNextTrack} className='button' />
                <ReplyIcon className='button' />
            </div>

            {/* Right */}
            <div className='flex item-center space-x-3 md:space-x-4 justify-end pr-5'>
                <VolumeDownIcon onClick={() => volume > 0 && setVolume(volume - 10)} className='button' />
                <input className='w-14 md:w-28' type="range" value={volume} onChange={(e) => setVolume(Number(e.target.value))} min={0} max={100} />
                <VolumeUpIcon onClick={() => volume < 100 && setVolume(volume + 10)} className='button' />
            </div>
        </div>
    )
}

export default Player