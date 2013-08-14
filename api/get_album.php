<?php

$id = $_GET['id'];
$data = file_get_contents("search_data.json");
$album_obj=json_decode($data,true);


foreach ($album_obj as $key => $album) {
    if($album['id'] == $id)
    {
        $show_data = $album;
        break;
    }
}

if($show_data['id']=='')
    die('no data here....');

?>

<div class="row-fluid" style="padding-left:170px; padding-right:250px;">
  <div class="row-fluid">
      <div class="span3">
        <img src="<?=$show_data['cover']?>" class="img-rounded">
      </div>
      <div class="span6 hero-unit">
        <h3><?=$show_data['title']?></h3>
        <p><a class="btn btn-large"  id="addBtn"><i class="icon-plus-sign"></i>add new playlist</a></p>
      </div>
    </div>
      <div class="row-fluid">
        <div class="span9">
          <table class="table table-striped table-bordered table-bordered table-hover">
            <thead>
              <tr>
                <th>項次</th>
                <th>曲目</th>
              </tr>
            </thead>
            <tbody>
              <?php foreach ($show_data['tracks'] as $key => $track) { ?>
              <tr>
                <td><?=$key+1?></td>
                <td><?=$track['title']?></td>
              </tr>  
              <?php } ?>
                            
            </tbody>
          </table>          
        </div>
</div>
